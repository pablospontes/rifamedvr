CREATE TABLE "configuracao" (
	"id" integer PRIMARY KEY,
	"titulo" text DEFAULT 'RIFA MEDVR' NOT NULL,
	"premio1" text DEFAULT '' NOT NULL,
	"premio2" text DEFAULT '' NOT NULL,
	"premio3" text DEFAULT '' NOT NULL,
	"data_sorteio" text DEFAULT '' NOT NULL,
	"valor_rifa" text DEFAULT '10.00' NOT NULL,
	"informacoes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rifas" (
	"numero" integer PRIMARY KEY,
	"nome" text DEFAULT '' NOT NULL,
	"telefone" text DEFAULT '' NOT NULL,
	"aluno" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
