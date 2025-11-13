BEGIN;

-- Удаляем дочерние записи и таблицы, если они существуют
DROP TABLE IF EXISTS bet_events CASCADE;

-- Удаляем перечислимые типы, если они уже созданы
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_type_enum') THEN
    DROP TYPE bet_type_enum;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_scope_enum') THEN
    DROP TYPE bet_scope_enum;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_market_enum') THEN
    DROP TYPE bet_market_enum;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_total_side_enum') THEN
    DROP TYPE bet_total_side_enum;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_status_enum') THEN
    DROP TYPE bet_status_enum;
  END IF;
END
$$;

-- Удаляем основную таблицу ставок
DROP TABLE IF EXISTS bets CASCADE;

-- Создаём перечислимые типы
CREATE TYPE bet_type_enum AS ENUM ('single', 'express');
CREATE TYPE bet_scope_enum AS ENUM ('overall', 'map');
CREATE TYPE bet_market_enum AS ENUM ('winner', 'total', 'exact_score');
CREATE TYPE bet_total_side_enum AS ENUM ('over', 'under');
CREATE TYPE bet_status_enum AS ENUM ('active', 'settled', 'canceled');

-- Основная таблица ставок
CREATE TABLE bets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_type bet_type_enum NOT NULL,
  category TEXT NOT NULL DEFAULT 'cybersport',
  stake_amount NUMERIC(12,2) NOT NULL CHECK (stake_amount > 0),
  total_odds NUMERIC(10,3) NOT NULL CHECK (total_odds > 0),
  potential_payout NUMERIC(14,2),
  status bet_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_status ON bets(status);

-- Таблица событий для ставок
CREATE TABLE bet_events (
  id BIGSERIAL PRIMARY KEY,
  bet_id BIGINT NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL CHECK (discipline IN ('cs2', 'dota2')),
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  scope bet_scope_enum NOT NULL,
  map_number SMALLINT CHECK (map_number BETWEEN 1 AND 5),
  market bet_market_enum NOT NULL,
  selection TEXT NOT NULL,
  total_side bet_total_side_enum,
  total_line NUMERIC(4,1),
  odds NUMERIC(10,3) NOT NULL CHECK (odds > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bet_events_bet_id ON bet_events(bet_id);
CREATE INDEX idx_bet_events_discipline ON bet_events(discipline);

-- Обновляем триггер для поля updated_at
CREATE OR REPLACE FUNCTION set_bets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_bets_updated_at
  BEFORE UPDATE ON bets
  FOR EACH ROW
  EXECUTE FUNCTION set_bets_updated_at();

COMMIT;

