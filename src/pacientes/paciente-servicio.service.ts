import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacienteServicio } from './paciente-servicio.entity';
import { CreatePacienteServicioDto } from './dto/create-paciente-servicio.dto';
import { Paciente } from './paciente.entity';
import { Servicios } from '../catalogos/servicios.entity';
import { AsignarServicioTerapeutaDto } from './dto/asignar-servicio-terapeuta.dto';
import { AsignacionTerapeuta } from './asignacion-terapeuta.entity';

@Injectable()
export class PacienteServicioService {
  constructor(
    @InjectRepository(PacienteServicio)
    private pacienteServicioRepository: Repository<PacienteServicio>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(Servicios)
    private serviciosRepository: Repository<Servicios>,
    @InjectRepository(AsignacionTerapeuta)
    private asignacionTerapeutaRepository: Repository<AsignacionTerapeuta>,
  ) {}

  async create(createPacienteServicioDto: CreatePacienteServicioDto): Promise<PacienteServicio> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: createPacienteServicioDto.paciente_id }
    });
    
    const servicio = await this.serviciosRepository.findOne({
      where: { id: createPacienteServicioDto.servicio_id }
    });

    if (!paciente || !servicio) {
      throw new Error('Paciente o servicio no encontrado');
    }

    const pacienteServicio = this.pacienteServicioRepository.create({
      paciente,
      servicio,
      fecha_inicio: new Date(createPacienteServicioDto.fecha_inicio),
      fecha_fin: createPacienteServicioDto.fecha_fin ? new Date(createPacienteServicioDto.fecha_fin) : null,
      motivo_consulta: createPacienteServicioDto.motivo_consulta,
      observaciones: createPacienteServicioDto.observaciones,
      activo: createPacienteServicioDto.activo ?? true,
    });

    return this.pacienteServicioRepository.save(pacienteServicio);
  }

  async findAll(): Promise<PacienteServicio[]> {
    return this.pacienteServicioRepository.find({
      relations: ['paciente', 'servicio', 'asignaciones', 'asignaciones.terapeuta'],
      where: { activo: true }
    });
  }

  async findByPaciente(pacienteId: number): Promise<PacienteServicio[]> {
    return this.pacienteServicioRepository.find({
      relations: ['paciente', 'servicio', 'asignaciones', 'asignaciones.terapeuta'],
      where: { 
        paciente: { id: pacienteId },
        activo: true 
      }
    });
  }

  async findByServicio(servicioId: number): Promise<PacienteServicio[]> {
    return this.pacienteServicioRepository.find({
      relations: ['paciente', 'servicio', 'asignaciones', 'asignaciones.terapeuta'],
      where: { 
        servicio: { id: servicioId },
        activo: true 
      }
    });
  }

  async findOne(id: number): Promise<PacienteServicio> {
    return this.pacienteServicioRepository.findOne({
      relations: ['paciente', 'servicio', 'asignaciones', 'asignaciones.terapeuta'],
      where: { id, activo: true }
    });
  }

  async update(id: number, updatePacienteServicioDto: Partial<CreatePacienteServicioDto>): Promise<PacienteServicio> {
    const pacienteServicio = await this.findOne(id);
    if (!pacienteServicio) {
      throw new Error('PacienteServicio no encontrado');
    }

    Object.assign(pacienteServicio, updatePacienteServicioDto);
    return this.pacienteServicioRepository.save(pacienteServicio);
  }

  async remove(id: number): Promise<void> {
    const pacienteServicio = await this.findOne(id);
    if (!pacienteServicio) {
      throw new Error('PacienteServicio no encontrado');
    }

    pacienteServicio.activo = false;
    await this.pacienteServicioRepository.save(pacienteServicio);
  }

  async asignarServicioYTerapeuta(dto: AsignarServicioTerapeutaDto) {
    // 1. Verificar si ya existe un paciente_servicio activo para este paciente y servicio
    const existingPacienteServicio = await this.pacienteServicioRepository.findOne({
      where: { 
        paciente: { id: dto.paciente_id },
        servicio: { id: dto.servicio_id },
        activo: true 
      }
    });

    let savedPacienteServicio: PacienteServicio;

    if (existingPacienteServicio) {
      // Si existe, actualizar el existente
      savedPacienteServicio = existingPacienteServicio;
    } else {
      // Si no existe, crear uno nuevo
      const pacienteServicio = this.pacienteServicioRepository.create({
        paciente: { id: dto.paciente_id },
        servicio: { id: dto.servicio_id },
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : new Date(),
        estado: 'ACTIVO',
        activo: true
      });
      savedPacienteServicio = await this.pacienteServicioRepository.save(pacienteServicio);
    }

    // 2. Solo crear asignacion_terapeuta si se envía terapeuta_id
    if (dto.terapeuta_id) {
      console.log('Asignando terapeuta:', dto.terapeuta_id, 'a paciente_servicio:', savedPacienteServicio.id);
      
      // Desactivar asignaciones anteriores del mismo paciente_servicio
      const asignacionesAnteriores = await this.asignacionTerapeutaRepository.find({
        where: {
          pacienteServicio: { id: savedPacienteServicio.id },
          estado: 'ACTIVO',
          activo: true
        }
      });

      console.log('Asignaciones anteriores encontradas:', asignacionesAnteriores.length);

      if (asignacionesAnteriores.length > 0) {
        for (const asignacion of asignacionesAnteriores) {
          asignacion.estado = 'INACTIVO';
          asignacion.fecha_fin = new Date();
          asignacion.activo = false;
          await this.asignacionTerapeutaRepository.save(asignacion);
        }
      }

      // Crear nueva asignación activa
      const asignacion = this.asignacionTerapeutaRepository.create({
        pacienteServicio: savedPacienteServicio,
        terapeuta: { id: dto.terapeuta_id },
        fecha_asignacion: dto.fecha_inicio ? new Date(dto.fecha_inicio) : new Date(),
        estado: 'ACTIVO',
        activo: true
      });
      
      const resultado = await this.asignacionTerapeutaRepository.save(asignacion);
      console.log('Nueva asignación creada:', resultado);
    }

    return { message: 'Servicio asignado correctamente' + (dto.terapeuta_id ? ' y terapeuta asignado' : '') };
  }

  async getServiciosConTerapeutaActual(pacienteId: number) {
    const servicios = await this.pacienteServicioRepository.find({
      where: { paciente: { id: pacienteId }, activo: true },
      relations: [
        'servicio',
        'asignaciones',
        'asignaciones.terapeuta'
      ],
      order: {
        created_at: 'DESC'
      }
    });

    return servicios.map(ps => {
      // Buscar la asignación activa más reciente
      const terapeutaActual = ps.asignaciones?.find(a => 
        a.estado === 'ACTIVO' && a.activo
      );
      
      return {
        id: ps.id,
        servicio: ps.servicio?.nombre,
        servicio_id: ps.servicio?.id,
        terapeuta: terapeutaActual?.terapeuta
          ? `Lic. ${terapeutaActual.terapeuta.nombres} ${terapeutaActual.terapeuta.apellidos}`
          : null,
        terapeuta_id: terapeutaActual?.terapeuta?.id || null,
        fecha_inicio: ps.fecha_inicio,
        estado: ps.estado,
        motivo_consulta: ps.motivo_consulta
      };
    });
  }

  async desasignarServicio(pacienteId: number, servicioId: number): Promise<{ message: string }> {
    // 1. Buscar el paciente_servicio activo
    const pacienteServicio = await this.pacienteServicioRepository.findOne({
      where: { 
        paciente: { id: pacienteId },
        servicio: { id: servicioId },
        activo: true 
      },
      relations: ['asignaciones']
    });

    if (!pacienteServicio) {
      throw new Error(`No se encontró un servicio activo con ID ${servicioId} para el paciente ${pacienteId}`);
    }

    // 2. Desactivar todas las asignaciones de terapeuta asociadas
    if (pacienteServicio.asignaciones && pacienteServicio.asignaciones.length > 0) {
      for (const asignacion of pacienteServicio.asignaciones) {
        if (asignacion.activo) {
          asignacion.estado = 'INACTIVO';
          asignacion.fecha_fin = new Date();
          asignacion.activo = false;
          await this.asignacionTerapeutaRepository.save(asignacion);
        }
      }
    }

    // 3. Desactivar el paciente_servicio
    pacienteServicio.activo = false;
    pacienteServicio.fecha_fin = new Date();
    pacienteServicio.estado = 'INACTIVO';
    await this.pacienteServicioRepository.save(pacienteServicio);

    return { 
      message: `Servicio "${pacienteServicio.servicio?.nombre}" desasignado correctamente del paciente` 
    };
  }

  async desasignarServicioPorId(pacienteServicioId: number): Promise<{ message: string }> {
    // 1. Buscar el paciente_servicio por ID
    const pacienteServicio = await this.pacienteServicioRepository.findOne({
      where: { id: pacienteServicioId, activo: true },
      relations: ['asignaciones', 'servicio']
    });

    if (!pacienteServicio) {
      throw new Error(`PacienteServicio con ID ${pacienteServicioId} no encontrado`);
    }

    // 2. Desactivar todas las asignaciones de terapeuta asociadas
    if (pacienteServicio.asignaciones && pacienteServicio.asignaciones.length > 0) {
      for (const asignacion of pacienteServicio.asignaciones) {
        if (asignacion.activo) {
          asignacion.estado = 'INACTIVO';
          asignacion.fecha_fin = new Date();
          asignacion.activo = false;
          await this.asignacionTerapeutaRepository.save(asignacion);
        }
      }
    }

    // 3. Desactivar el paciente_servicio
    pacienteServicio.activo = false;
    pacienteServicio.fecha_fin = new Date();
    pacienteServicio.estado = 'INACTIVO';
    await this.pacienteServicioRepository.save(pacienteServicio);

    return { 
      message: `Servicio "${pacienteServicio.servicio?.nombre}" desasignado correctamente del paciente` 
    };
  }
} 