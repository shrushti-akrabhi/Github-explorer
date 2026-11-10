import Icon from './Icon';
import { useSaved } from '../saved/SavedContext';
import { LANG_COLORS, num, updatedLabel } from '../utils';

export default function RepoRow({ r, full }) {
  const { isSaved, isBusy, toggle } = useSaved();
  const saved = isSaved(r.id);
  return (
    <div className="repo">
      <div className="rt">
        <h3>
          <a href={r.html_url} target="_blank" rel="noopener noreferrer">{full ? r.full_name : r.name}</a>
          <span className="badge">{r.fork ? 'Fork' : 'Public'}</span>
        </h3>
        <button className={saved ? 'sec on' : 'sec'} type="button" aria-pressed={saved} disabled={isBusy(r.id)} onClick={() => toggle(r)}>
          <Icon name="star" />{saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {r.description && <p>{r.description}</p>}
      {r.topics?.length > 0 && <div className="topics">{r.topics.slice(0, 5).map((t) => <span className="topic" key={t}>{t}</span>)}</div>}
      <div className="rm">
        {r.language && <span><i className="dot" style={{ background: LANG_COLORS[r.language] || '#8b949e' }} />{r.language}</span>}
        {r.stargazers_count > 0 && <span><Icon name="star" />{num(r.stargazers_count)}</span>}
        {r.forks_count > 0 && <span><Icon name="fork" />{num(r.forks_count)}</span>}
        <span>{updatedLabel(r.updated_at)}</span>
      </div>
    </div>
  );
}
