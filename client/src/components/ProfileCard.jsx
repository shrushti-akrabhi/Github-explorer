import Icon from './Icon';
import { num } from '../utils';

export default function ProfileCard({ user: u }) {
  const site = u.blog && (/^https?:/.test(u.blog) ? u.blog : 'https://' + u.blog);
  return (
    <aside>
      <img className="avatar" src={u.avatar_url} alt={u.login} />
      <h1>
        {u.name || u.login}
        <span>{u.login}</span>
      </h1>
      {u.bio && <div className="bio">{u.bio}</div>}
      <a href={u.html_url} target="_blank" rel="noopener noreferrer">
        <button className="sec" type="button">View on GitHub</button>
      </a>
      <div className="stats">
        <Icon name="people" />
        <b>{num(u.followers)}</b> followers · <b>{num(u.following)}</b> following
      </div>
      <ul className="meta">
        {u.company && <li><Icon name="org" />{u.company}</li>}
        {u.location && <li><Icon name="pin" />{u.location}</li>}
        {site && (
          <li>
            <Icon name="link" />
            <a href={site} target="_blank" rel="noopener noreferrer">{u.blog}</a>
          </li>
        )}
        <li>
          <Icon name="cal" />
          Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </li>
      </ul>
    </aside>
  );
}
