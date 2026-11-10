import { Component } from 'react';

// If any component crashes while drawing, show a message instead of a blank screen.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="msg" style={{ margin: 32 }}>
        <h2>Something went wrong</h2>
        <p>Reload the page to try again.</p>
        <button className="pri" type="button" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}