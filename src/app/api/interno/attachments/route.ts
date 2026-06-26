import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { deleteAttachment, uploadAttachment } from "@/lib/project/project-service";
import { isAttachmentCategory, isAttachmentEntityType } from "@/lib/project/constants";

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const form = await request.formData();
    const file = form.get("file");
    const entityType = String(form.get("entityType") ?? "");
    const entityId = String(form.get("entityId") ?? "");
    const category = String(form.get("category") ?? "OUTRO");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }
    if (!isAttachmentEntityType(entityType)) {
      return NextResponse.json({ error: "Tipo de entidade inválido" }, { status: 400 });
    }
    if (!isAttachmentCategory(category)) {
      return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadAttachment({
      tenantId: user.tenantId,
      entityType,
      entityId,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      buffer,
      category,
      uploadedById: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("id");
    if (!attachmentId) {
      return NextResponse.json({ error: "Informe id do anexo" }, { status: 400 });
    }

    const result = await deleteAttachment({
      tenantId: user.tenantId,
      attachmentId,
      deletedBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
