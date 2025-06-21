import { writable } from 'svelte/store';

type AgeCheckStatus = 'pending' | 'approved' | 'rejected';

interface AgeStoreState {
  status: AgeCheckStatus;
  isAnimationComplete: boolean;
}

// Check localStorage for saved age verification
const getInitialState = (): AgeStoreState => {
  if (typeof localStorage === 'undefined') {
    return {
      status: 'pending',
      isAnimationComplete: false
    };
  }

  const savedStatus = localStorage.getItem('age-verification');
  return {
    status: savedStatus === 'approved' ? 'approved' : 'pending',
    isAnimationComplete: savedStatus === 'approved'
  };
};


function createAgeStore() {
  const { subscribe, update, set } = writable<AgeStoreState>(getInitialState());

  return {
    subscribe,
    checkAge: (isAdult: boolean) => {
      if (isAdult) {
        // Save to localStorage to persist between sessions
        localStorage.setItem('age-verification', 'approved');
        update(state => ({
          ...state,
          status: 'approved'
        }));
      } else {
        // Redirect to YouTube if under 18 (within 200ms as specified)
        setTimeout(() => {
          window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        }, 100);
        update(state => ({
          ...state,
          status: 'rejected'
        }));
      }
    },
    completeAnimation: () => {
      update(state => ({
        ...state,
        isAnimationComplete: true
      }));
    },
    reset: () => {
      localStorage.removeItem('age-verification');
      set(getInitialState());
    }
  };
}

export const ageStore = createAgeStore();
