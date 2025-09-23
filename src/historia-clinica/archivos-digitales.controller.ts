import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  HttpStatus,
  HttpException,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ArchivosDigitalesService } from './archivos-digitales.service';
import { CreateArchivoDigitalDto } from './dto/create-archivo-digital.dto';
import { UpdateArchivoDigitalDto } from './dto/update-archivo-digital.dto';

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('backend_api/archivos-digitales')
export class ArchivosDigitalesController {
  constructor(private readonly archivosDigitalesService: ArchivosDigitalesService) {}

  // Rutas para Archivos Digitales
  @Post()
  @UseInterceptors(FileInterceptor('archivo', {
    storage: undefined, // Usaremos manejo manual del archivo
    fileFilter: (req, file, callback) => {
      // Validar tipos de archivo permitidos
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new HttpException(
          `Formato de archivo no permitido. Tipos permitidos: PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX. Formato recibido: ${file.mimetype}`, 
          HttpStatus.BAD_REQUEST
        ), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
  }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createArchivoDigitalDto: any,
  ) {
    if (!file) {
      throw new HttpException('Archivo requerido', HttpStatus.BAD_REQUEST);
    }

    // Validar peso máximo del archivo
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new HttpException(
        `El archivo excede el peso máximo permitido. Peso máximo: 10MB. Peso del archivo: ${(file.size / (1024 * 1024)).toFixed(2)}MB`, 
        HttpStatus.BAD_REQUEST
      );
    }

    // Generar nombre único para el archivo
    const extension = path.extname(file.originalname);
    const nombreArchivo = `${uuidv4()}${extension}`;
    
    // Crear subcarpeta para archivos digitales
    const subcarpeta = 'archivos_digitales';
    const rutaArchivo = `${subcarpeta}/${nombreArchivo}`;

    // Guardar archivo en el sistema de archivos
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const subcarpetaCompleta = path.join(uploadsDir, subcarpeta);
    
    if (!fs.existsSync(subcarpetaCompleta)) {
      fs.mkdirSync(subcarpetaCompleta, { recursive: true });
    }

    const rutaCompleta = path.join(uploadsDir, rutaArchivo);
    fs.writeFileSync(rutaCompleta, file.buffer);

    // Validar que los IDs sean números válidos
    const terapeutaId = parseInt(createArchivoDigitalDto.terapeutaId);
    const tipoArchivoId = parseInt(createArchivoDigitalDto.tipoArchivoId);
    const pacienteId = createArchivoDigitalDto.pacienteId ? parseInt(createArchivoDigitalDto.pacienteId) : null;

    if (isNaN(terapeutaId)) {
      throw new HttpException('ID de terapeuta inválido', HttpStatus.BAD_REQUEST);
    }

    if (isNaN(tipoArchivoId)) {
      throw new HttpException('ID de tipo de archivo inválido', HttpStatus.BAD_REQUEST);
    }

    if (pacienteId !== null && isNaN(pacienteId)) {
      throw new HttpException('ID de paciente inválido', HttpStatus.BAD_REQUEST);
    }

    // Crear DTO con la información del archivo
    const dto: CreateArchivoDigitalDto = {
      terapeutaId,
      tipoArchivoId,
      descripcion: createArchivoDigitalDto.descripcion || null,
      nombreArchivo: nombreArchivo,
      nombreOriginal: file.originalname,
      tipoMime: file.mimetype,
      tamano: file.size,
      rutaArchivo: rutaArchivo,
      pacienteId,
    };

    return await this.archivosDigitalesService.create(dto);
  }

  // Ruta para obtener todos los tipos de archivo (DEBE IR ANTES que las rutas con :id)
  @Get('tipos')
  async findAllTiposArchivo() {
    return await this.archivosDigitalesService.findAllTiposArchivo();
  }

  @Get()
  async findAll(@Query('pacienteId') pacienteId?: string, @Query('terapeutaId') terapeutaId?: string) {
    let archivos;
    
    // Si se proporcionan ambos parámetros, buscar por terapeuta Y paciente
    if (pacienteId && terapeutaId && !isNaN(parseInt(pacienteId)) && !isNaN(parseInt(terapeutaId))) {
      archivos = await this.archivosDigitalesService.findByTerapeutaAndPaciente(parseInt(terapeutaId), parseInt(pacienteId));
    }
    // Si solo se proporciona pacienteId
    else if (pacienteId && !isNaN(parseInt(pacienteId))) {
      archivos = await this.archivosDigitalesService.findByPaciente(parseInt(pacienteId));
    }
    // Si solo se proporciona terapeutaId
    else if (terapeutaId && !isNaN(parseInt(terapeutaId))) {
      archivos = await this.archivosDigitalesService.findByTerapeuta(parseInt(terapeutaId));
    }
    // Si no se proporcionan parámetros, devolver todos
    else {
      archivos = await this.archivosDigitalesService.findAll();
    }

    // Agregar uploads/ a la ruta de cada archivo
    return archivos.map(archivo => ({
      ...archivo,
      rutaArchivo: `uploads/${archivo.rutaArchivo}`
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    const archivo = await this.archivosDigitalesService.findOne(numericId);
    
    // Agregar uploads/ a la ruta del archivo
    return {
      ...archivo,
      rutaArchivo: `uploads/${archivo.rutaArchivo}`
    };
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    const archivoDigital = await this.archivosDigitalesService.findOne(numericId);
    
    const rutaCompleta = path.join(process.cwd(), 'uploads', archivoDigital.rutaArchivo);
    
    if (!fs.existsSync(rutaCompleta)) {
      throw new HttpException('Archivo no encontrado en el servidor', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Type', archivoDigital.tipoMime);
    res.setHeader('Content-Disposition', `attachment; filename="${archivoDigital.nombreOriginal}"`);
    
    const fileStream = fs.createReadStream(rutaCompleta);
    fileStream.pipe(res);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateArchivoDigitalDto: UpdateArchivoDigitalDto) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    return await this.archivosDigitalesService.update(numericId, updateArchivoDigitalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    return await this.archivosDigitalesService.remove(numericId);
  }
}
