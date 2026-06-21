import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { clientes } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export default async (req: Request, context: Context) => {
  const id = context.params.id ? Number(context.params.id) : null;

  if (req.method === "GET") {
    if (id) {
      const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id));
      if (!cliente) return new Response("Not found", { status: 404 });
      return Response.json(cliente);
    }
    const todos = await db.select().from(clientes).orderBy(desc(clientes.criadoEm));
    return Response.json(todos);
  }

  if (req.method === "POST") {
    const body = await req.json();
    if (!body.nome?.trim()) {
      return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    const [novo] = await db.insert(clientes).values({
      nome: body.nome.trim(),
      email: body.email?.trim() || null,
      telefone: body.telefone?.trim() || null,
      cpf: body.cpf?.trim() || null,
      endereco: body.endereco?.trim() || null,
      cidade: body.cidade?.trim() || null,
      observacoes: body.observacoes?.trim() || null,
    }).returning();
    return Response.json(novo, { status: 201 });
  }

  if (req.method === "PUT" && id) {
    const body = await req.json();
    if (!body.nome?.trim()) {
      return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    const [atualizado] = await db.update(clientes).set({
      nome: body.nome.trim(),
      email: body.email?.trim() || null,
      telefone: body.telefone?.trim() || null,
      cpf: body.cpf?.trim() || null,
      endereco: body.endereco?.trim() || null,
      cidade: body.cidade?.trim() || null,
      observacoes: body.observacoes?.trim() || null,
      atualizadoEm: new Date(),
    }).where(eq(clientes.id, id)).returning();
    if (!atualizado) return new Response("Not found", { status: 404 });
    return Response.json(atualizado);
  }

  if (req.method === "DELETE" && id) {
    await db.delete(clientes).where(eq(clientes.id, id));
    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: ["/api/clientes", "/api/clientes/:id"],
};
