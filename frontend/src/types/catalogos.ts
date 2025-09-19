// src/types/catalogos.ts

/** Item genérico utilizado em vários catálogos */
export interface CatalogoItem {
  id: string;
  nome: string;
  descricao: string;
  caminho: string;
}

export interface Catalogo {
  formacoes: Trilha[];
  recursos: CatalogoItem[];
  mentorias: CatalogoItem[];
}

/** Catálogo de Trilhas com seus módulos */
export interface CatalogoFormacoes {
  formacoes: Trilha[];
}

export interface Trilha {
  id: string;
  nome: string;
  descricao: string;
  modulos: Modulo[];
}

export interface Modulo {
  id: string;
  nome: string;
  status: "ativo" | "em_breve";
}

/** =======================
 * Catálogo de Capítulos (por módulo)
 * ======================= */
export interface CatalogoCapitulos {
  trilha: string;
  modulo: string;
  capitulos: CapituloSimples[];
}

export interface CapituloSimples {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
}

/** Catálogo principal de recursos */
export interface CatalogoRecursos {
  recursos: Recurso[];
}

/** Recurso listado no catálogo principal */
export interface Recurso {
  id: string;
  tipo: string; // ex: "ebooks", "templates"
  nome: string;
  descricao: string;
  caminho: string;
  home?: boolean;
  formato?: string;
}

/** =======================
 * Catálogo de eBooks
 * ======================= */
export interface CatalogoEbooks {
  ebooks: Ebook[];
}

/** Detalhes de um eBook */
export interface Ebook {
  id: string;
  nome: string;
  descricao: string;
  autor: string;
  data_publicacao: string;
  numero_paginas: number;
  idioma: string;
  categorias: string[];
  nivel_dificuldade: string;
  formato: string;
  palavras_chave: string[];
  url_download: string;
  sumario: Capitulo[];
}

export interface Capitulo {
  capitulo: string;
  topicos: string[];
}

/** =======================
 * Catálogo de Templates
 * ======================= */
export interface CatalogoTemplates {
  templates: Template[];
}

export interface Template {
  id: string;
  nome: string;
  descricao: string;
  url_download: string;
  formato: string;
  tipo_documento: string;
  autor?: string;
}

/** =======================
 * Catálogo de Projetos
 * ======================= */
export interface CatalogoProjetos {
  projetos: CatalogoItem[];
}

/** =======================
 * Catálogo de Mentorias
 * ======================= */
export interface CatalogoMentorias {
  mentorias: CatalogoItem[];
}