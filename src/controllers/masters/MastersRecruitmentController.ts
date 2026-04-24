import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import type { RowDataPacket } from 'mysql2/promise';
import { callProc } from '../../db/proc';
import { httpError } from '../../utils/httpErrors';

type InterviewMode = {
  interview_mode_id: number;
  mode_name: string;
  description: string | null;
  status: 0 | 1;
  created_at: string;
};

type VisaType = {
  visa_type_id: number;
  visa_type_name: string;
  description: string | null;
  status: 0 | 1;
  created_at: string;
};

type Language = {
  language_id: number;
  language_name: string;
  status: 0 | 1;
  created_at: string;
};

type Education = {
  education_id: number;
  education_name: string;
  description: string | null;
  status: 0 | 1;
  created_at: string;
};

type Skill = {
  skill_id: number;
  skill_name: string;
  description: string | null;
  status: 0 | 1;
  created_at: string;
};

@Route('masters/recruitment')
@Tags('Masters')
export class MastersRecruitmentController extends Controller {
  @Get('interview-modes')
  @Security('jwt')
  public async listInterviewModes(@Query() include_inactive?: boolean): Promise<InterviewMode[]> {
    return callProc<RowDataPacket & InterviewMode>(
      `CALL sp_rec_interview_modes('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('interview-modes')
  @Security('jwt')
  public async createInterviewMode(
    @Body() body: { mode_name: string; description?: string | null; status?: boolean }
  ): Promise<{ interview_mode_id: number }> {
    const rows = await callProc<RowDataPacket & { interview_mode_id: number }>(
      `CALL sp_rec_interview_modes('CREATE', NULL, :mode_name, :description, :status, NULL)`,
      {
        mode_name: body.mode_name,
        description: body.description ?? null,
        status: body.status ?? true
      }
    );
    const interview_mode_id = rows[0]?.interview_mode_id;
    if (!interview_mode_id) throw httpError(500, 'Failed to create interview mode');
    return { interview_mode_id };
  }

  @Put('interview-modes/{id}')
  @Security('jwt')
  public async updateInterviewMode(
    @Path() id: number,
    @Body() body: Partial<{ mode_name: string; description: string | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_interview_modes('UPDATE', :id, :mode_name, :description, :status, NULL)`,
      {
        id,
        mode_name: body.mode_name ?? null,
        description: body.description ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Interview mode not found');
    return { updated: true };
  }

  @Delete('interview-modes/{id}')
  @Security('jwt')
  public async disableInterviewMode(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_interview_modes('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Interview mode not found');
    return { disabled: true };
  }

  @Get('visa-types')
  @Security('jwt')
  public async listVisaTypes(@Query() include_inactive?: boolean): Promise<VisaType[]> {
    return callProc<RowDataPacket & VisaType>(
      `CALL sp_rec_visa_types('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('visa-types')
  @Security('jwt')
  public async createVisaType(
    @Body() body: { visa_type_name: string; description?: string | null; status?: boolean }
  ): Promise<{ visa_type_id: number }> {
    const rows = await callProc<RowDataPacket & { visa_type_id: number }>(
      `CALL sp_rec_visa_types('CREATE', NULL, :visa_type_name, :description, :status, NULL)`,
      {
        visa_type_name: body.visa_type_name,
        description: body.description ?? null,
        status: body.status ?? true
      }
    );
    const visa_type_id = rows[0]?.visa_type_id;
    if (!visa_type_id) throw httpError(500, 'Failed to create visa type');
    return { visa_type_id };
  }

  @Put('visa-types/{id}')
  @Security('jwt')
  public async updateVisaType(
    @Path() id: number,
    @Body() body: Partial<{ visa_type_name: string; description: string | null; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_visa_types('UPDATE', :id, :visa_type_name, :description, :status, NULL)`,
      {
        id,
        visa_type_name: body.visa_type_name ?? null,
        description: body.description ?? null,
        status: typeof body.status === 'boolean' ? body.status : null
      }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Visa type not found');
    return { updated: true };
  }

  @Delete('visa-types/{id}')
  @Security('jwt')
  public async disableVisaType(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_visa_types('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Visa type not found');
    return { disabled: true };
  }

  @Get('languages')
  @Security('jwt')
  public async listLanguages(@Query() include_inactive?: boolean): Promise<Language[]> {
    return callProc<RowDataPacket & Language>(
      `CALL sp_rec_languages('LIST', NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('languages')
  @Security('jwt')
  public async createLanguage(@Body() body: { language_name: string; status?: boolean }): Promise<{ language_id: number }> {
    const rows = await callProc<RowDataPacket & { language_id: number }>(
      `CALL sp_rec_languages('CREATE', NULL, :language_name, :status, NULL)`,
      { language_name: body.language_name, status: body.status ?? true }
    );
    const language_id = rows[0]?.language_id;
    if (!language_id) throw httpError(500, 'Failed to create language');
    return { language_id };
  }

  @Put('languages/{id}')
  @Security('jwt')
  public async updateLanguage(
    @Path() id: number,
    @Body() body: Partial<{ language_name: string; status: boolean }>
  ): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_languages('UPDATE', :id, :language_name, :status, NULL)`,
      { id, language_name: body.language_name ?? null, status: typeof body.status === 'boolean' ? body.status : null }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Language not found');
    return { updated: true };
  }

  @Delete('languages/{id}')
  @Security('jwt')
  public async disableLanguage(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_languages('DISABLE', :id, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Language not found');
    return { disabled: true };
  }

  @Get('education')
  @Security('jwt')
  public async listEducation(@Query() include_inactive?: boolean): Promise<Education[]> {
    return callProc<RowDataPacket & Education>(
      `CALL sp_rec_educations('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('education')
  @Security('jwt')
  public async createEducation(@Body() body: { education_name: string; description?: string | null; status?: boolean }): Promise<{ education_id: number }> {
    const rows = await callProc<RowDataPacket & { education_id: number }>(
      `CALL sp_rec_educations('CREATE', NULL, :education_name, :description, :status, NULL)`,
      { education_name: body.education_name, description: body.description ?? null, status: body.status ?? true }
    );
    const education_id = rows[0]?.education_id;
    if (!education_id) throw httpError(500, 'Failed to create education');
    return { education_id };
  }

  @Put('education/{id}')
  @Security('jwt')
  public async updateEducation(@Path() id: number, @Body() body: Partial<{ education_name: string; description: string | null; status: boolean }>): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_educations('UPDATE', :id, :education_name, :description, :status, NULL)`,
      { id, education_name: body.education_name ?? null, description: body.description ?? null, status: typeof body.status === 'boolean' ? body.status : null }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Education not found');
    return { updated: true };
  }

  @Delete('education/{id}')
  @Security('jwt')
  public async disableEducation(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_educations('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Education not found');
    return { disabled: true };
  }

  @Get('skills')
  @Security('jwt')
  public async listSkills(@Query() include_inactive?: boolean): Promise<Skill[]> {
    return callProc<RowDataPacket & Skill>(
      `CALL sp_rec_skills('LIST', NULL, NULL, NULL, NULL, :include_inactive)`,
      { include_inactive: include_inactive ?? false }
    );
  }

  @Post('skills')
  @Security('jwt')
  public async createSkill(@Body() body: { skill_name: string; description?: string | null; status?: boolean }): Promise<{ skill_id: number }> {
    const rows = await callProc<RowDataPacket & { skill_id: number }>(
      `CALL sp_rec_skills('CREATE', NULL, :skill_name, :description, :status, NULL)`,
      { skill_name: body.skill_name, description: body.description ?? null, status: body.status ?? true }
    );
    const skill_id = rows[0]?.skill_id;
    if (!skill_id) throw httpError(500, 'Failed to create skill');
    return { skill_id };
  }

  @Put('skills/{id}')
  @Security('jwt')
  public async updateSkill(@Path() id: number, @Body() body: Partial<{ skill_name: string; description: string | null; status: boolean }>): Promise<{ updated: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_skills('UPDATE', :id, :skill_name, :description, :status, NULL)`,
      { id, skill_name: body.skill_name ?? null, description: body.description ?? null, status: typeof body.status === 'boolean' ? body.status : null }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Skill not found');
    return { updated: true };
  }

  @Delete('skills/{id}')
  @Security('jwt')
  public async disableSkill(@Path() id: number): Promise<{ disabled: true }> {
    const rows = await callProc<RowDataPacket & { affected_rows: number }>(
      `CALL sp_rec_skills('DISABLE', :id, NULL, NULL, NULL, NULL)`,
      { id }
    );
    if ((rows[0]?.affected_rows ?? 0) === 0) throw httpError(404, 'Skill not found');
    return { disabled: true };
  }
}
