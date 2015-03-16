DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS user_links; DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id SERIAL UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  PRIMARY KEY (id)
);

DROP TABLE IF EXISTS links;
CREATE TABLE links (
  id SERIAL UNIQUE NOT NULL,
  url TEXT NOT NULL,
  title TEXT DEFAULT '',
  posted TIMESTAMP DEFAULT current_timestamp,
  PRIMARY KEY (id)
);
CREATE INDEX url_index ON links (url);

CREATE TABLE user_subscriptions (
  id SERIAL UNIQUE NOT NULL,
  fro_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  to_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  CHECK (fro_id != to_id),
  UNIQUE (fro_id, to_id),
  PRIMARY KEY (id)
);

CREATE TABLE user_links (
  id SERIAL UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  link_id INTEGER NOT NULL REFERENCES links (id) ON DELETE RESTRICT,
  UNIQUE (user_id, link_id),
  PRIMARY KEY (id)
);

