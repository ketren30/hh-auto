import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { VacancyItem } from '../../types';

export interface PollingState {
  newVacancies: VacancyItem[];
  lastSuccessfulPollAt?: string;
  lastPollError: string | null;
}

type Action =
  | { type: 'success'; at: string; added: VacancyItem[] }
  | { type: 'error'; message: string }
  | { type: 'removeVacancy'; vacancyId: string };

function dedupeById(list: VacancyItem[]): VacancyItem[] {
  const m = new Map<string, VacancyItem>();
  for (const v of list) m.set(v.id, v);
  return [...m.values()];
}

function reducer(state: PollingState, action: Action): PollingState {
  switch (action.type) {
    case 'success':
      return {
        ...state,
        lastPollError: null,
        lastSuccessfulPollAt: action.at,
        newVacancies: dedupeById([...state.newVacancies, ...action.added]),
      };
    case 'error':
      return {
        ...state,
        lastPollError: action.message,
      };
    case 'removeVacancy':
      return {
        ...state,
        newVacancies: state.newVacancies.filter((v) => v.id !== action.vacancyId),
      };
    default:
      return state;
  }
}

interface PollingContextValue extends PollingState {
  dispatch: Dispatch<Action>;
}

const PollingContext = createContext<PollingContextValue | null>(null);

export function PollingStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    newVacancies: [],
    lastPollError: null,
  });

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return <PollingContext.Provider value={value}>{children}</PollingContext.Provider>;
}

export function usePollingState(): PollingContextValue {
  const ctx = useContext(PollingContext);
  if (!ctx) throw new Error('usePollingState вне PollingStateProvider');
  return ctx;
}

export function usePollingDispatch(): Dispatch<Action> {
  return usePollingState().dispatch;
}
