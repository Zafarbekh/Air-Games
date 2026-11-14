CREATE TABLE public.game_rooms (
  code TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  host_player_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.game_rooms TO service_role;
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES public.game_rooms(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ready BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  player_token UUID NOT NULL DEFAULT gen_random_uuid(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rooms ADD CONSTRAINT game_rooms_host_fk FOREIGN KEY (host_player_id) REFERENCES public.room_players(id) ON DELETE SET NULL;
CREATE INDEX room_players_room_idx ON public.room_players(room_code);

CREATE OR REPLACE FUNCTION public.air_room_json(p_code TEXT)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'code', r.code,
    'gameId', r.game_id,
    'status', r.status,
    'hostPlayerId', r.host_player_id,
    'players', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'ready', p.ready, 'isHost', p.is_host) ORDER BY p.joined_at)
      FROM public.room_players p WHERE p.room_code = r.code
    ), '[]'::jsonb)
  )
  FROM public.game_rooms r WHERE r.code = p_code;
$$;

CREATE OR REPLACE FUNCTION public.air_create_room(p_game_id TEXT, p_name TEXT)
RETURNS JSONB
LANGUAGE PLPGSQL
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code TEXT;
  v_player_id UUID;
  v_token UUID;
  v_attempt INTEGER := 0;
BEGIN
  IF p_game_id NOT IN ('snake', 'quiz', 'bomb', 'racing') THEN RAISE EXCEPTION 'Unknown game.'; END IF;
  IF length(trim(p_name)) < 1 OR length(trim(p_name)) > 24 THEN RAISE EXCEPTION 'Player name must be 1–24 characters.'; END IF;
  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::integer, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.game_rooms WHERE code = v_code);
    v_attempt := v_attempt + 1;
    IF v_attempt >= 20 THEN RAISE EXCEPTION 'Could not allocate a room code. Try again.'; END IF;
  END LOOP;
  INSERT INTO public.game_rooms(code, game_id) VALUES (v_code, p_game_id);
  INSERT INTO public.room_players(room_code, name, ready, is_host)
  VALUES (v_code, trim(p_name), true, true)
  RETURNING id, player_token INTO v_player_id, v_token;
  UPDATE public.game_rooms SET host_player_id = v_player_id WHERE code = v_code;
  RETURN public.air_room_json(v_code) || jsonb_build_object('playerId', v_player_id, 'playerToken', v_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.air_join_room(p_code TEXT, p_name TEXT)
RETURNS JSONB
LANGUAGE PLPGSQL
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_game_id TEXT;
  v_capacity INTEGER;
  v_player_id UUID;
  v_token UUID;
BEGIN
  SELECT game_id, CASE game_id WHEN 'quiz' THEN 8 ELSE 4 END INTO v_game_id, v_capacity
  FROM public.game_rooms WHERE code = upper(trim(p_code)) AND status = 'lobby' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Room not found or the game has already started.'; END IF;
  IF length(trim(p_name)) < 1 OR length(trim(p_name)) > 24 THEN RAISE EXCEPTION 'Player name must be 1–24 characters.'; END IF;
  IF (SELECT count(*) FROM public.room_players WHERE room_code = upper(trim(p_code))) >= v_capacity THEN RAISE EXCEPTION 'This room is full.'; END IF;
  INSERT INTO public.room_players(room_code, name)
  VALUES (upper(trim(p_code)), trim(p_name))
  RETURNING id, player_token INTO v_player_id, v_token;
  UPDATE public.game_rooms SET updated_at = now() WHERE code = upper(trim(p_code));
  RETURN public.air_room_json(upper(trim(p_code))) || jsonb_build_object('playerId', v_player_id, 'playerToken', v_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.air_get_room(p_code TEXT, p_player_id UUID, p_token UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.room_players SET last_seen = now()
  WHERE room_code = upper(trim(p_code)) AND id = p_player_id AND player_token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your player session is no longer valid.'; END IF;
  RETURN public.air_room_json(upper(trim(p_code)));
END;
$$;

CREATE OR REPLACE FUNCTION public.air_set_ready(p_code TEXT, p_player_id UUID, p_token UUID, p_ready BOOLEAN)
RETURNS JSONB
LANGUAGE PLPGSQL
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.room_players p SET ready = p_ready
  FROM public.game_rooms r
  WHERE r.code = upper(trim(p_code)) AND p.room_code = r.code AND p.id = p_player_id AND p.player_token = p_token AND r.status = 'lobby';
  IF NOT FOUND THEN RAISE EXCEPTION 'Ready state can only change in a valid lobby.'; END IF;
  RETURN public.air_room_json(upper(trim(p_code)));
END;
$$;

CREATE OR REPLACE FUNCTION public.air_start_room(p_code TEXT, p_player_id UUID, p_token UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_game_id TEXT;
  v_minimum INTEGER;
BEGIN
  SELECT game_id, CASE game_id WHEN 'quiz' THEN 2 ELSE 2 END INTO v_game_id, v_minimum
  FROM public.game_rooms
  WHERE code = upper(trim(p_code)) AND host_player_id = p_player_id AND status = 'lobby'
    AND EXISTS (SELECT 1 FROM public.room_players WHERE id = p_player_id AND player_token = p_token)
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Only the host can start this lobby.'; END IF;
  IF (SELECT count(*) FROM public.room_players WHERE room_code = upper(trim(p_code))) < v_minimum THEN RAISE EXCEPTION 'At least % players are needed.', v_minimum; END IF;
  IF EXISTS (SELECT 1 FROM public.room_players WHERE room_code = upper(trim(p_code)) AND NOT ready) THEN RAISE EXCEPTION 'Every player must be ready.'; END IF;
  UPDATE public.game_rooms SET status = 'playing', updated_at = now() WHERE code = upper(trim(p_code));
  RETURN public.air_room_json(upper(trim(p_code)));
END;
$$;

CREATE OR REPLACE FUNCTION public.air_restart_room(p_code TEXT, p_player_id UUID, p_token UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.game_rooms r SET status = 'lobby', updated_at = now()
  WHERE r.code = upper(trim(p_code)) AND r.host_player_id = p_player_id
    AND EXISTS (SELECT 1 FROM public.room_players WHERE id = p_player_id AND player_token = p_token AND room_code = r.code);
  IF NOT FOUND THEN RAISE EXCEPTION 'Only the host can restart this room.'; END IF;
  UPDATE public.room_players SET ready = is_host WHERE room_code = upper(trim(p_code));
  RETURN public.air_room_json(upper(trim(p_code)));
END;
$$;

CREATE OR REPLACE FUNCTION public.air_leave_room(p_code TEXT, p_player_id UUID, p_token UUID)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_host BOOLEAN;
BEGIN
  SELECT is_host INTO v_host FROM public.room_players
  WHERE room_code = upper(trim(p_code)) AND id = p_player_id AND player_token = p_token FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_host THEN
    DELETE FROM public.game_rooms WHERE code = upper(trim(p_code));
  ELSE
    DELETE FROM public.room_players WHERE id = p_player_id;
    UPDATE public.game_rooms SET updated_at = now() WHERE code = upper(trim(p_code));
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON public.game_rooms FROM anon, authenticated;
REVOKE ALL ON public.room_players FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.air_room_json(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.air_create_room(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.air_join_room(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.air_get_room(TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.air_set_ready(TEXT, UUID, UUID, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.air_start_room(TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.air_restart_room(TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.air_leave_room(TEXT, UUID, UUID) TO anon, authenticated;
GRANT ALL ON FUNCTION public.air_room_json(TEXT) TO service_role;
GRANT ALL ON FUNCTION public.air_create_room(TEXT, TEXT) TO service_role;
GRANT ALL ON FUNCTION public.air_join_room(TEXT, TEXT) TO service_role;
GRANT ALL ON FUNCTION public.air_get_room(TEXT, UUID, UUID) TO service_role;
GRANT ALL ON FUNCTION public.air_set_ready(TEXT, UUID, UUID, BOOLEAN) TO service_role;
GRANT ALL ON FUNCTION public.air_start_room(TEXT, UUID, UUID) TO service_role;
GRANT ALL ON FUNCTION public.air_restart_room(TEXT, UUID, UUID) TO service_role;
GRANT ALL ON FUNCTION public.air_leave_room(TEXT, UUID, UUID) TO service_role;