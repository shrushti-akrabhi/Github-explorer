const ERRORS = {
  notfound: (name) => [`No user named “${name}”`, 'Check the spelling and try again.'],
  ratelimit: () => ['You’ve hit GitHub’s rate limit', 'GitHub allows 60 requests an hour without a token. Try again in a little while.'],
  network: () => ['Couldn’t reach GitHub', 'Check your internet connection and search again.'],
  http: () => ['GitHub returned an error', 'Wait a moment and try again.'],
};

export function Message({ title, text }) {
  return (
    <div className="msg">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

export function ErrorMessage({ kind, name }) {
  const [title, text] = (ERRORS[kind] || ERRORS.http)(name);
  return <Message title={title} text={text} />;
}

export function Skeleton() {
  return (
    <>
      <div>
        <div className="sk" style={{ aspectRatio: 1, borderRadius: '50%', maxWidth: 296 }} />
        <div className="sk" style={{ height: 28, marginTop: 16 }} />
        <div className="sk" style={{ height: 60, marginTop: 16 }} />
      </div>
      <div>
        {[0, 1, 2, 3].map((i) => <div key={i} className="sk" style={{ height: 90, marginBottom: 16 }} />)}
      </div>
    </>
  );
}
