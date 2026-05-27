import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db, rifas, configuracao } from "../../db/index.js";

// Helper to ensure database is seeded with 400 tickets and default configuration
async function ensureSeeded() {
  try {
    const existingConfig = await db.select().from(configuracao).where(eq(configuracao.id, 1)).limit(1);
    if (existingConfig.length === 0) {
      await db.insert(configuracao).values({
        id: 1,
        titulo: "RIFA MEDVR",
        premio1: "1º Prêmio - Smartphone de Última Geração",
        premio2: "2º Prêmio - Caixa de Som Bluetooth JBL",
        premio3: "3º Prêmio - PIX de R$ 100,00",
        dataSorteio: "20/12/2026",
        valorRifa: "10.00",
        informacoes: "Sorteio será realizado pela Loteria Federal. Contato: (24) 99999-9999",
      });
    }

    const countResult = await db.select().from(rifas).limit(1);
    if (countResult.length === 0) {
      const batchSize = 100;
      for (let b = 0; b < 400; b += batchSize) {
        const rows = [];
        for (let i = b + 1; i <= b + batchSize && i <= 400; i++) {
          rows.push({
            numero: i,
            nome: "",
            telefone: "",
            aluno: "",
          });
        }
        await db.insert(rifas).values(rows);
      }
    }
  } catch (error) {
    console.error("Error in seeding database:", error);
  }
}

// 1. Fetch all tickets and general configuration
export const getRaffleData = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const allRifas = await db.select().from(rifas).orderBy(rifas.numero);
  const [config] = await db.select().from(configuracao).where(eq(configuracao.id, 1));
  return {
    rifas: allRifas,
    config: config || {
      id: 1,
      titulo: "RIFA MEDVR",
      premio1: "",
      premio2: "",
      premio3: "",
      dataSorteio: "",
      valorRifa: "10.00",
      informacoes: "",
    },
  };
});

// 2. Update a single ticket
export const updateTicket = createServerFn({ method: "POST" })
  .inputValidator((data: { numero: number; nome: string; telefone: string; aluno: string }) => data)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(rifas)
      .set({
        nome: data.nome,
        telefone: data.telefone,
        aluno: data.aluno,
        updatedAt: new Date(),
      })
      .where(eq(rifas.numero, data.numero))
      .returning();
    return updated;
  });

// 3. Clear/reset a ticket
export const clearTicket = createServerFn({ method: "POST" })
  .inputValidator((data: { numero: number }) => data)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(rifas)
      .set({
        nome: "",
        telefone: "",
        aluno: "",
        updatedAt: new Date(),
      })
      .where(eq(rifas.numero, data.numero))
      .returning();
    return updated;
  });

// 4. Update config
export const updateConfig = createServerFn({ method: "POST" })
  .inputValidator((data: {
    titulo: string;
    premio1: string;
    premio2: string;
    premio3: string;
    dataSorteio: string;
    valorRifa: string;
    informacoes: string;
  }) => data)
  .handler(async ({ data }) => {
    const [updated] = await db
      .update(configuracao)
      .set({
        titulo: data.titulo,
        premio1: data.premio1,
        premio2: data.premio2,
        premio3: data.premio3,
        dataSorteio: data.dataSorteio,
        valorRifa: data.valorRifa,
        informacoes: data.informacoes,
      })
      .where(eq(configuracao.id, 1))
      .returning();
    return updated;
  });

// 5. Batch import tickets
export const importTickets = createServerFn({ method: "POST" })
  .inputValidator((data: {
    tickets: Array<{ numero: number; nome: string; telefone: string; aluno: string }>;
  }) => data)
  .handler(async ({ data }) => {
    // We update each ticket in a loop/transaction
    for (const ticket of data.tickets) {
      if (ticket.numero >= 1 && ticket.numero <= 400) {
        await db
          .update(rifas)
          .set({
            nome: ticket.nome || "",
            telefone: ticket.telefone || "",
            aluno: ticket.aluno || "",
            updatedAt: new Date(),
          })
          .where(eq(rifas.numero, ticket.numero));
      }
    }
    const allRifas = await db.select().from(rifas).orderBy(rifas.numero);
    return allRifas;
  });
