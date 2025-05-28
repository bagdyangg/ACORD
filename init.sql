-- Initial database setup for lunch ordering system

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSONB NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" VARCHAR PRIMARY KEY NOT NULL,
  "email" VARCHAR UNIQUE,
  "first_name" VARCHAR,
  "last_name" VARCHAR,
  "profile_image_url" VARCHAR,
  "role" VARCHAR DEFAULT 'employee' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Dishes table (simplified - only images)
CREATE TABLE IF NOT EXISTS "dishes" (
  "id" SERIAL PRIMARY KEY,
  "image_path" VARCHAR(500) NOT NULL,
  "date" DATE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Orders table (simplified - no prices)
CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id"),
  "dish_id" INTEGER NOT NULL REFERENCES "dishes"("id"),
  "quantity" INTEGER DEFAULT 1,
  "order_date" DATE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_dishes_date" ON "dishes" ("date");
CREATE INDEX IF NOT EXISTS "idx_orders_date" ON "orders" ("order_date");
CREATE INDEX IF NOT EXISTS "idx_orders_user" ON "orders" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_dish" ON "orders" ("dish_id");