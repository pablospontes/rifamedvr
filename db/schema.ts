import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

export const rifas = pgTable("rifas", {
  numero: integer("numero").primaryKey(),
  nome: text("nome").notNull().default(""),
  telefone: text("telefone").notNull().default(""),
  aluno: text("aluno").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const configuracao = pgTable("configuracao", {
  id: integer("id").primaryKey(),
  titulo: text("titulo").notNull().default("RIFA MEDVR"),
  premio1: text("premio1").notNull().default(""),
  premio2: text("premio2").notNull().default(""),
  premio3: text("premio3").notNull().default(""),
  dataSorteio: text("data_sorteio").notNull().default(""),
  valorRifa: text("valor_rifa").notNull().default("10.00"),
  informacoes: text("informacoes").notNull().default(""),
});

// === ADICIONE A TABELA ABAIXO ===
export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(), // Gerado via crypto.randomUUID() no cadastro
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // Senha criptografada
  role: text("role").notNull().default("comum"), // 'admin' ou 'comum'
  status: text("status").notNull().default("pendente"), // 'pendente' ou 'aprovado'
  createdAt: timestamp("created_at").defaultNow(),
});