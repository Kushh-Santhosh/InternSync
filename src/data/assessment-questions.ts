import type { AssessmentQuestion } from '@/types'

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Python 1
  {
    id: 'py-q1',
    skillName: 'Python',
    question: 'What is the output of the following list comprehension snippet?',
    codeSnippet: `matrix = [[1, 2], [3, 4]]
flattened = [num for row in matrix for num in row if num % 2 != 0]
print(flattened)`,
    options: ['[1, 2, 3, 4]', '[1, 3]', '[2, 4]', '[[1], [3]]'],
    correctIndex: 1,
    explanation:
      'The comprehension iterates row by row, then through elements in each row, filtering for odd numbers (1 and 3).',
    difficulty: 'medium',
  },
  // Python 2
  {
    id: 'py-q2',
    skillName: 'Python',
    question: 'How do default mutable arguments (like lists or dicts) behave in Python functions?',
    codeSnippet: `def append_item(val, items=[]):
    items.append(val)
    return items

print(append_item(1))
print(append_item(2))`,
    options: [
      '[1] then [2]',
      '[1] then [1, 2]',
      'Throws TypeError at runtime',
      'None',
    ],
    correctIndex: 1,
    explanation:
      'In Python, default arguments are evaluated only once when the function definition is executed, creating a shared persistent mutable object.',
    difficulty: 'medium',
  },
  // Python 3
  {
    id: 'py-q3',
    skillName: 'Python',
    question: 'What is the primary difference between a generator function with `yield` and a standard function returning a list?',
    options: [
      'Generators execute multithreaded operations automatically',
      'Generators compute values lazily on-demand, reducing memory footprint for large sequences',
      'Standard functions cannot return sequences larger than 10,000 items',
      'Generators cannot be iterated with a for-loop',
    ],
    correctIndex: 1,
    explanation:
      '`yield` produces items one at a time on demand rather than buffering the entire sequence in memory.',
    difficulty: 'easy',
  },

  // React 1
  {
    id: 'react-q1',
    skillName: 'React',
    question: 'Why does React state setter functions accept a functional updater argument (e.g. `setCount(prev => prev + 1)`)?',
    options: [
      'To prevent unnecessary re-renders of child components',
      'To ensure state updates reliably calculate against the latest queued state during batched updates',
      'To allow asynchronous promises directly inside the state hook',
      'To trigger synchronous DOM repaints immediately',
    ],
    correctIndex: 1,
    explanation:
      'Because React batches state updates, passing an updater callback guarantees you are reading the freshest pending state.',
    difficulty: 'medium',
  },
  // React 2
  {
    id: 'react-q2',
    skillName: 'React',
    question: 'What is the correct purpose of `useMemo` in React applications?',
    options: [
      'To cache costly computational values between renders unless dependencies change',
      'To replace standard JavaScript garbage collection',
      'To persist data to browser localStorage automatically',
      'To debounce network fetch calls',
    ],
    correctIndex: 0,
    explanation:
      '`useMemo` memoizes the result of an expensive calculation between re-renders based on its dependency array.',
    difficulty: 'easy',
  },

  // SQL 1
  {
    id: 'sql-q1',
    skillName: 'SQL',
    question: 'What is the difference between WHERE and HAVING clauses in SQL?',
    options: [
      'WHERE is used for numeric fields, HAVING for text strings',
      'WHERE filters rows before aggregation; HAVING filters groups after aggregation',
      'HAVING runs before the FROM clause is processed',
      'They are completely synonymous in modern ANSI SQL',
    ],
    correctIndex: 1,
    explanation:
      '`WHERE` filters individual rows prior to grouping, whereas `HAVING` filters aggregated groups formed by `GROUP BY`.',
    difficulty: 'easy',
  },
  // SQL 2
  {
    id: 'sql-q2',
    skillName: 'SQL',
    question: 'Which index type is optimal for high-cardinality equality lookups and range queries in PostgreSQL?',
    options: ['Hash Index', 'B-Tree Index', 'GIN Index', 'BRIN Index'],
    correctIndex: 1,
    explanation:
      'B-Tree is the default PostgreSQL index structure and is exceptionally well-suited for equality and ordered range scans (<, <=, =, >=, >).',
    difficulty: 'medium',
  },

  // AI / ML 1
  {
    id: 'ml-q1',
    skillName: 'Machine Learning',
    question: 'Why is vector cosine similarity commonly preferred over Euclidean distance for high-dimensional text embeddings?',
    options: [
      'Cosine similarity is immune to floating point errors',
      'Cosine similarity measures directional orientation irrespective of vector magnitude/length',
      'Euclidean distance cannot be computed in more than 3 dimensions',
      'Cosine similarity requires zero matrix multiplications',
    ],
    correctIndex: 1,
    explanation:
      'Text embeddings often have variable magnitudes based on document token length; cosine similarity normalizes by magnitude and measures directional semantic angle.',
    difficulty: 'medium',
  },
  // AI / ML 2
  {
    id: 'ml-q2',
    skillName: 'Machine Learning',
    question: 'What symptom indicates that a deep learning model is severely overfitting the training dataset?',
    options: [
      'Both training loss and validation loss remain high and stagnant',
      'Training loss decreases continuously while validation loss starts increasing',
      'Validation accuracy matches training accuracy across all epochs',
      'The learning rate automatically scales to zero',
    ],
    correctIndex: 1,
    explanation:
      'Divergence where training error drops but validation error begins rising is the classic signature of overfitting/memorization.',
    difficulty: 'easy',
  },
]
