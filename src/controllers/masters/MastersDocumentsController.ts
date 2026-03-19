import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type DocumentType = {
  document_type_id: number;
  document_name: string;
  is_required: 0 | 1;
  status: 0 | 1;
  created_at: string;
};

@Route('masters/documents')
@Tags('Masters')
export class MastersDocumentsController extends Controller {
  @Get('types')
  @Security('jwt')
  public async listDocumentTypes(@Query() include_inactive?: boolean): Promise<DocumentType[]> {
    return callProc<RowDataPacket & DocumentType>(
      `CALL sp_doc_document_types('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('types')
  @Security('jwt')
  public async createDocumentType(
    @Body() body: { document_name: string; is_required?: boolean; status?: boolean }
  ): Promise<{ document_type_id: number }> {
    const rows = await callProc<RowDataPacket & { document_type_id: number }>(
      `CALL sp_doc_document_types('CREATE', NULL, :document_name, :is_required, :status, NULL)`,
      {
        document_name: body.document_name,
        is_required: body.is_required ?? false,
        status: body.status ?? true
      }
    );
    const document_type_id = rows[0]?.document_type_id;
    if (!document_type_id) throw httpError(500, 'Failed to create document type');
    return { document_type_id };
  }

  @Put('types/{id}')
  @Security('jwt')
  public async updateDocumentType(
    @Path() id: number,
    @Body() body: Partial<{ document_name: string; is_required: boolean; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_doc_document_types('UPDATE', :id, :document_name, :is_required, :status, NULL)`,
      {
        id,
        document_name: body.document_name ?? null,
        is_required: typeof body.is_required === 'boolean' ? body.is_required : null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Document type not found');
    return { updated: true };
  }

  @Delete('types/{id}')
  @Security('jwt')
  public async disableDocumentType(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_doc_document_types('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Document type not found');
    return { disabled: true };
  }
}
