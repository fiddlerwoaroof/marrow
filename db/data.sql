INSERT INTO users (name, password, email) VALUES
  ('user1', 'password', 'user1@example.com'),
  ('user2', 'password', 'user2@example.com'),
  ('user3', 'password', 'user2@example.com'),
  ('user4', 'password', 'user2@example.com'),
  ('user5', 'password', 'user2@example.com'),
  ('user6', 'password', 'user2@example.com'),
  ('user7', 'password', 'user2@example.com'),
  ('user8', 'password', 'user2@example.com');

SELECT * FROM put_link('user1', 'http://arguendo.com/this/is-link');
SELECT * FROM put_link('user1', 'http://example.com/this/is-a-link');
SELECT * FROM put_link('user1', 'http://google.com/is/is-a-link');
SELECT * FROM put_link('user2', 'http://arguendo.com/this/is-link');
SELECT * FROM put_link('user2', 'http://arguendo.com/this/is-link?a=we&b=34534');
SELECT * FROM put_link('user2', 'http://example.com/this/is-a-link');
SELECT * FROM put_link('user2', 'http://google.com/is/is-a-link');
SELECT * FROM put_link('user3', 'http://arguendo.com/this/is-link');
SELECT * FROM put_link('user3', 'http://arguendo.com/this/is-link?a=we&b=34534');
SELECT * FROM put_link('user3', 'http://example.com/this/is-a-link');
SELECT * FROM put_link('user3', 'http://google.com/is/is-a-link');
SELECT * FROM put_link('user4', 'http://arguendo.com/this/is-link?a=we&b=34534');
SELECT * FROM put_link('user5', 'http://arguendo.com/this/is-link?a=we&b=34534');
SELECT * FROM put_link('user5', 'http://facebook.com');
SELECT * FROM put_link('user5', 'http://google.com/is/is-a-link');
SELECT * FROM put_link('user5', 'http://learn.knockoutjs.com/#/?tutorial=webmail');
SELECT * FROM put_link('user5', 'http://python.org');
SELECT * FROM put_link('user6', 'http://learn.knockoutjs.com/#/?tutorial=webmail');
SELECT * FROM put_link('user6', 'http://stackoverflow.com/questions/13715743/psycopg2-not-actually-inserting-data');
SELECT * FROM put_link('user7', 'http://learn.knockoutjs.com/#/?tutorial=webmail');
SELECT * FROM put_link('user7', 'https://mail.google.com/mail/u/3/#inbox');
