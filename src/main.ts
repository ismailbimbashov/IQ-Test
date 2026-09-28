import './styles/main.css';
import { boot } from './app';
import { installGlobalErrorHandlers, renderFatal } from './ui/errors';

installGlobalErrorHandlers();
try {
  boot();
} catch (err) {
  renderFatal(err);
}
