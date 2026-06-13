import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getUser, getUsers } from './userService';
import { useSettings } from '@/features/settings/SettingsContext';
import type { User } from '@/shared/db/types';

interface UserCtx {
  activeUser: User | null;
  users: User[];
  reload: () => Promise<void>;
}

const Ctx = createContext<UserCtx>({ activeUser: null, users: [], reload: async () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  async function reload() {
    const all = await getUsers();
    setUsers(all);
    if (settings.activeUserId) {
      const u = await getUser(settings.activeUserId);
      setActiveUser(u ?? null);
    } else {
      setActiveUser(null);
    }
  }

  useEffect(() => { reload(); }, [settings.activeUserId]);

  return <Ctx.Provider value={{ activeUser, users, reload }}>{children}</Ctx.Provider>;
}

export const useUsers = () => useContext(Ctx);
