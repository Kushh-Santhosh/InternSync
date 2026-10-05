/**
 * Standardized Skill Taxonomy and Alias Normalizer
 */

export interface CanonicalSkill {
  canonicalName: string
  category: 'frontend' | 'backend' | 'ai_ml' | 'data' | 'languages' | 'tools'
  aliases: string[]
}

export const SKILL_TAXONOMY: CanonicalSkill[] = [
  {
    canonicalName: 'Python',
    category: 'languages',
    aliases: ['python', 'python3', 'py', 'cpython'],
  },
  {
    canonicalName: 'JavaScript',
    category: 'languages',
    aliases: ['javascript', 'js', 'es6', 'ecmascript'],
  },
  {
    canonicalName: 'TypeScript',
    category: 'languages',
    aliases: ['typescript', 'ts'],
  },
  {
    canonicalName: 'React',
    category: 'frontend',
    aliases: ['react', 'react.js', 'reactjs', 'react-native'],
  },
  {
    canonicalName: 'Node.js',
    category: 'backend',
    aliases: ['node', 'node.js', 'nodejs', 'express', 'express.js'],
  },
  {
    canonicalName: 'Machine Learning',
    category: 'ai_ml',
    aliases: ['ml', 'machine learning', 'machine-learning', 'applied ml'],
  },
  {
    canonicalName: 'Deep Learning',
    category: 'ai_ml',
    aliases: ['deep learning', 'dl', 'neural networks', 'ann', 'cnn'],
  },
  {
    canonicalName: 'PyTorch',
    category: 'ai_ml',
    aliases: ['pytorch', 'torch'],
  },
  {
    canonicalName: 'TensorFlow',
    category: 'ai_ml',
    aliases: ['tensorflow', 'tf', 'keras'],
  },
  {
    canonicalName: 'Computer Vision',
    category: 'ai_ml',
    aliases: ['cv', 'computer vision', 'opencv', 'image processing'],
  },
  {
    canonicalName: 'Natural Language Processing',
    category: 'ai_ml',
    aliases: ['nlp', 'natural language processing', 'llm', 'transformers', 'huggingface'],
  },
  {
    canonicalName: 'SQL',
    category: 'data',
    aliases: ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite', 'relational database'],
  },
  {
    canonicalName: 'MongoDB',
    category: 'data',
    aliases: ['mongodb', 'mongo', 'nosql'],
  },
  {
    canonicalName: 'Firebase',
    category: 'backend',
    aliases: ['firebase', 'firestore'],
  },
  {
    canonicalName: 'Docker',
    category: 'tools',
    aliases: ['docker', 'containerization', 'containers'],
  },
  {
    canonicalName: 'Git',
    category: 'tools',
    aliases: ['git', 'github', 'version control'],
  },
  {
    canonicalName: 'Tailwind CSS',
    category: 'frontend',
    aliases: ['tailwind', 'tailwindcss', 'tailwind-css'],
  },
  {
    canonicalName: 'Next.js',
    category: 'frontend',
    aliases: ['next', 'next.js', 'nextjs'],
  },
  {
    canonicalName: 'FastAPI',
    category: 'backend',
    aliases: ['fastapi', 'fast-api'],
  },
  {
    canonicalName: 'Pandas',
    category: 'data',
    aliases: ['pandas', 'data analysis', 'numpy'],
  },
]

const aliasMap = new Map<string, string>()

SKILL_TAXONOMY.forEach((skill) => {
  aliasMap.set(skill.canonicalName.toLowerCase(), skill.canonicalName)
  skill.aliases.forEach((alias) => {
    aliasMap.set(alias.toLowerCase(), skill.canonicalName)
  })
})

/**
 * Normalizes any freeform skill query or resume string to its canonical name.
 */
export function normalizeSkill(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim().toLowerCase()
  return aliasMap.get(trimmed) || raw.trim()
}

/**
 * Compares two skills handling aliases and case-insensitivity.
 */
export function areSkillsEqual(a: string, b: string): boolean {
  return normalizeSkill(a).toLowerCase() === normalizeSkill(b).toLowerCase()
}
