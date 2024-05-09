import { PrismaClient } from '@prisma/client';
import { join } from 'path';

export const rootDir = join(__dirname, '..', '..');
export const srcDir = join(rootDir, 'src');

export const Prisma = new PrismaClient();

export const PART_OF_SPEECH_LOOKUP = [
	'noun',
	'verb',
	'adverb',
	'adjective',
	'preposition',
	'conjunction',
	'pronoun',
	'article',
	'interjection',
	'phrase',
	'determiner',
	'character',
	'suffix',
	'prefix'
];
