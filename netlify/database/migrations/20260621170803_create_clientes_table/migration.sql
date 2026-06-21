CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY,
	"nome" text NOT NULL,
	"email" text,
	"telefone" text,
	"cpf" text,
	"endereco" text,
	"cidade" text,
	"observacoes" text,
	"criado_em" timestamp DEFAULT now(),
	"atualizado_em" timestamp DEFAULT now()
);
