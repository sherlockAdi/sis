import { Body, Controller, Delete, Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import { httpError } from '../../utils/httpErrors';

type NotificationTemplateRow = {
  template_id: number;
  template_code: string;
  template_name: string;
  category: string;
  channel: string;
  recipient_type: string;
  subject_template: string | null;
  text_template: string | null;
  html_template: string | null;
  signature_name: string | null;
  signature_title: string | null;
  status: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

type NotificationTemplateCreate = {
  template_code: string;
  template_name: string;
  category?: string;
  channel?: string;
  recipient_type?: string;
  subject_template?: string | null;
  text_template?: string | null;
  html_template?: string | null;
  signature_name?: string | null;
  signature_title?: string | null;
  status?: boolean;
};

type NotificationTemplateUpdate = Partial<NotificationTemplateCreate>;

function toText(value: unknown): string {
  return String(value ?? '').trim();
}

function toCode(value: unknown): string {
  return toText(value).toUpperCase();
}

async function getTemplateById(templateId: number): Promise<NotificationTemplateRow | null> {
  const [rows] = await pool.query<(RowDataPacket & NotificationTemplateRow)[]>(
    `SELECT template_id, template_code, template_name, category, channel, recipient_type,
            subject_template, text_template, html_template, signature_name, signature_title, status, created_at, updated_at
     FROM NOTI_U01_notification_templates
     WHERE template_id = :template_id
     LIMIT 1`,
    { template_id: templateId },
  );
  return rows[0] ?? null;
}

@Route('notification-templates')
@Tags('Notification Templates')
export class NotificationTemplatesController extends Controller {
  @Get()
  @Security('jwt')
  public async list(): Promise<NotificationTemplateRow[]> {
    const [rows] = await pool.query<(RowDataPacket & NotificationTemplateRow)[]>(
      `SELECT template_id, template_code, template_name, category, channel, recipient_type,
              subject_template, text_template, html_template, signature_name, signature_title, status, created_at, updated_at
       FROM NOTI_U01_notification_templates
       ORDER BY category ASC, template_name ASC, template_id ASC`
    );
    return rows;
  }

  @Get('{templateId}')
  @Security('jwt')
  public async get(@Path() templateId: number): Promise<NotificationTemplateRow> {
    const row = await getTemplateById(templateId);
    if (!row) throw httpError(404, 'Notification template not found');
    return row;
  }

  @Post()
  @Security('jwt')
  public async create(@Body() body: NotificationTemplateCreate): Promise<{ template_id: number }> {
    const template_code = toCode(body.template_code);
    const template_name = toText(body.template_name);
    if (!template_code) throw httpError(400, 'template_code is required');
    if (!template_name) throw httpError(400, 'template_name is required');

    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO NOTI_U01_notification_templates
          (template_code, template_name, category, channel, recipient_type, subject_template, text_template, html_template, signature_name, signature_title, status)
         VALUES
          (:template_code, :template_name, :category, :channel, :recipient_type, :subject_template, :text_template, :html_template, :signature_name, :signature_title, :status)`,
        {
          template_code,
          template_name,
          category: toText(body.category) || 'GENERAL',
          channel: toText(body.channel).toUpperCase() || 'EMAIL',
          recipient_type: toText(body.recipient_type) || 'candidate',
          subject_template: body.subject_template ?? null,
          text_template: body.text_template ?? null,
          html_template: body.html_template ?? null,
          signature_name: body.signature_name ?? null,
          signature_title: body.signature_title ?? null,
          status: typeof body.status === 'boolean' ? body.status : true,
        },
      );

      if (!result.insertId) throw httpError(500, 'Failed to create notification template');
      return { template_id: result.insertId };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'template_code already exists');
      throw e;
    }
  }

  @Put('{templateId}')
  @Security('jwt')
  public async update(@Path() templateId: number, @Body() body: NotificationTemplateUpdate): Promise<{ updated: true }> {
    const current = await getTemplateById(templateId);
    if (!current) throw httpError(404, 'Notification template not found');

    try {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE NOTI_U01_notification_templates
         SET template_code = :template_code,
             template_name = :template_name,
             category = :category,
             channel = :channel,
             recipient_type = :recipient_type,
             subject_template = :subject_template,
             text_template = :text_template,
             html_template = :html_template,
             signature_name = :signature_name,
             signature_title = :signature_title,
             status = :status
         WHERE template_id = :template_id`,
        {
          template_id: templateId,
          template_code: body.template_code !== undefined ? toCode(body.template_code) : current.template_code,
          template_name: body.template_name !== undefined ? toText(body.template_name) : current.template_name,
          category: body.category !== undefined ? toText(body.category) || 'GENERAL' : current.category,
          channel: body.channel !== undefined ? toText(body.channel).toUpperCase() || 'EMAIL' : current.channel,
          recipient_type: body.recipient_type !== undefined ? toText(body.recipient_type) || 'candidate' : current.recipient_type,
          subject_template: body.subject_template !== undefined ? body.subject_template : current.subject_template,
          text_template: body.text_template !== undefined ? body.text_template : current.text_template,
          html_template: body.html_template !== undefined ? body.html_template : current.html_template,
          signature_name: body.signature_name !== undefined ? body.signature_name : current.signature_name,
          signature_title: body.signature_title !== undefined ? body.signature_title : current.signature_title,
          status: typeof body.status === 'boolean' ? body.status : Boolean(current.status),
        },
      );

      if (result.affectedRows === 0) throw httpError(404, 'Notification template not found');
      return { updated: true };
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') throw httpError(409, 'template_code already exists');
      throw e;
    }
  }

  @Delete('{templateId}')
  @Security('jwt')
  public async disable(@Path() templateId: number): Promise<{ disabled: true }> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE NOTI_U01_notification_templates
       SET status = FALSE
       WHERE template_id = :template_id`,
      { template_id: templateId },
    );
    if (result.affectedRows === 0) throw httpError(404, 'Notification template not found');
    return { disabled: true };
  }
}
