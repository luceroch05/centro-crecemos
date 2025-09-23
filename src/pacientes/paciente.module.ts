import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './paciente.entity';
import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';
import { PacienteServicio } from './paciente-servicio.entity';
import { PacienteServicioService } from './paciente-servicio.service';
import { PacienteServicioController } from './paciente-servicio.controller';
import { AsignacionTerapeuta } from './asignacion-terapeuta.entity';
import { AsignacionTerapeutaService } from './asignacion-terapeuta.service';
import { AsignacionTerapeutaController } from './asignacion-terapeuta.controller';
import { HistoriaClinica } from './historia-clinica.entity';
import { HistoriaClinicaService } from './historia-clinica.service';
import { HistoriaClinicaController } from './historia-clinica.controller';
import { ComentarioTerapia } from './comentario-terapia.entity';
import { ComentarioTerapiaService } from './comentario-terapia.service';
import { ComentarioTerapiaController } from './comentario-terapia.controller';
import { RecepcionController } from './recepcion.controller';
import { TerapeutaController } from './terapeuta.controller';
import { EstadoPaciente } from './estado-paciente.entity';
import { Servicios } from '../catalogos/servicios.entity';

import { NotaEvolucion } from './entities/nota-evolucion.entity';
import { NotaEvolucionService } from './services/nota-evolucion.service';
import { NotaEvolucionController } from './controllers/nota-evolucion.controller';
import { TrabajadorCentro } from '../usuarios/trabajador-centro.entity';
import { ParejaPaciente } from './entities/pareja-paciente.entity';
import { ParejaPacienteService } from './services/pareja-paciente.service';
import { EstadoPacienteService } from './estado-paciente.service';
import { EstadoPacienteController } from './estado-paciente.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paciente,
      PacienteServicio,
      AsignacionTerapeuta,
      HistoriaClinica,
      ComentarioTerapia,
      EstadoPaciente,
      Servicios,
      NotaEvolucion,
      TrabajadorCentro,
      ParejaPaciente
    ])
  ],
  providers: [
    PacienteService,
    PacienteServicioService,
    AsignacionTerapeutaService,
    HistoriaClinicaService,
    ComentarioTerapiaService,
    NotaEvolucionService,
    ParejaPacienteService,
    EstadoPacienteService
  ],
  controllers: [
    PacienteController,
    PacienteServicioController,
    AsignacionTerapeutaController,
    HistoriaClinicaController,
    ComentarioTerapiaController,
    RecepcionController,
    TerapeutaController,
    NotaEvolucionController,
    EstadoPacienteController
  ]
})
export class PacienteModule {}