import useApi from '../hooks/useApi';
import ProfileCard from './ProfileCard';
import RepoList from './RepoList';
import { ErrorMessage, Skeleton } from './States';

export default function ProfileView({ path, name }) {
  const s = useApi(path);
  if (s.status === 'loading') return <Skeleton />;
  if (s.status === 'error') return <ErrorMessage kind={s.kind} name={name} />;
  const { user, repos } = s.data;
  return (
    <>
      <ProfileCard user={user} />
      <RepoList key={user.login} repos={repos} total={user.public_repos} />
    </>
  );
}
