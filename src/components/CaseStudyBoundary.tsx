import { Component, type ReactNode } from 'react';

export default class CaseStudyBoundary extends Component<{ children: ReactNode; close: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="loading-notice" role="alert"><p>This case study couldn’t open. Please reload the page and try again.</p><button className="error-close" onClick={this.props.close}>Dismiss</button></div>;
    return this.props.children;
  }
}
