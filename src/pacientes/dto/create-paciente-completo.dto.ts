import { IsString, IsOptional, IsNumber, IsBoolean, IsEmail, ValidateNested, IsObject, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateParejaDto } from './create-pareja.dto';

export class PacienteDataDto {
  @IsString()
  nombres: string;

  @IsString()
  apellido_paterno: string;

  @IsString()
  apellido_materno: string;

  @IsString()
  fecha_nacimiento: string;

  @IsNumber()
  tipo_documento_id: number;

  @IsString()
  numero_documento: string;

  @IsNumber()
  sexo_id: number;

  @IsNumber()
  distrito_id: number;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  celular2?: string;

  @IsOptional()
  @ValidateIf((o) => o.correo !== '' && o.correo !== null && o.correo !== undefined)
  @IsEmail({}, { message: 'El correo debe ser válido si se proporciona' })
  correo?: string;

  @IsOptional()
  @IsString()
  diagnostico_medico?: string;

  @IsOptional()
  @IsString()
  alergias?: string;

  @IsOptional()
  @IsString()
  medicamentos_actuales?: string;
}

export class ServicioDataDto {
  @IsNumber()
  servicio_id: number;

  @IsOptional()
  @IsString()
  motivo_consulta?: string;

  @IsOptional()
  @IsString()
  referido_por?: string;
}

export class ResponsableDataDto {
  @IsString()
  nombre: string;

  @IsString()
  apellido_paterno: string;

  @IsString()
  apellido_materno: string;

  @IsNumber()
  tipo_documento_id: number;

  @IsString()
  numero_documento: string;

  @IsNumber()
  relacion_id: number;

  @IsString()
  telefono: string;

  @IsEmail()
  email: string;
}

export class ConsentimientosDto {
  @IsBoolean()
  acepta_terminos: boolean;

  @IsBoolean()
  acepta_info_comercial: boolean;
}

export class MetadataDto {
  @IsOptional()
  @IsString()
  recaptchaToken?: string;

  @IsNumber()
  user_id: number;
}

export class CreatePacienteCompletoDto {
  @ValidateNested()
  @Type(() => PacienteDataDto)
  paciente: PacienteDataDto;

  @ValidateNested()
  @Type(() => ServicioDataDto)
  servicio: ServicioDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsableDataDto)
  responsable?: ResponsableDataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateParejaDto)
  pareja?: CreateParejaDto;

  @ValidateNested()
  @Type(() => ConsentimientosDto)
  consentimientos: ConsentimientosDto;

  @ValidateNested()
  @Type(() => MetadataDto)
  metadata: MetadataDto;
} 