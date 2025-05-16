<style scoped>
.blog-detail-container {
  width: 100%;
  margin: 0;
  padding: 0;
  background: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.blog-header {
  background: linear-gradient(135deg, #f6f8fa 0%, #ffffff 100%);
  padding: 30px 15px;
  border-bottom: 1px solid #eaecef;
  margin-bottom: 20px;
  width: 100%;
  position: relative;
  z-index: 2;
}

.blog-title {
  font-size: 2em;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 15px;
  line-height: 1.3;
}

.blog-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
  font-size: 0.9em;
  flex-wrap: wrap;
}

.blog-meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.blog-meta-item i {
  color: #38bdf8;
}

.blog-content {
  width: 100%;
  margin: 0;
  padding: 0 15px 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

/* Markdown 样式优化 */
:deep(.markdown-body) {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #24292e;
  word-wrap: break-word;
  padding: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

:deep(.markdown-body > *) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}

:deep(.markdown-body a) {
  color: #38bdf8;
  text-decoration: none;
  position: relative;
  z-index: 3;
  cursor: pointer;
}

:deep(.markdown-body a:hover) {
  text-decoration: underline;
}

:deep(.markdown-body button) {
  position: relative;
  z-index: 3;
  cursor: pointer;
}

:deep(.markdown-body input),
:deep(.markdown-body select),
:deep(.markdown-body textarea) {
  position: relative;
  z-index: 3;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4),
:deep(.markdown-body h5),
:deep(.markdown-body h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1a1a1a;
  width: 100%;
}

:deep(.markdown-body h1) {
  font-size: 1.8em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

:deep(.markdown-body h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

:deep(.markdown-body h3) {
  font-size: 1.25em;
}

:deep(.markdown-body p) {
  margin-top: 0;
  margin-bottom: 16px;
  width: 100%;
}

:deep(.markdown-body code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

:deep(.markdown-body pre) {
  margin-top: 0;
  margin-bottom: 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  width: 100%;
  box-sizing: border-box;
}

:deep(.markdown-body pre code) {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
  width: 100%;
  display: block;
}

:deep(.markdown-body blockquote) {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
  width: 100%;
  box-sizing: border-box;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 4px;
  display: block;
}

:deep(.markdown-body table) {
  display: block;
  width: 100%;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 16px;
  border-spacing: 0;
  border-collapse: collapse;
}

:deep(.markdown-body table th),
:deep(.markdown-body table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

:deep(.markdown-body table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

:deep(.markdown-body table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

:deep(.markdown-body li) {
  margin-top: 0.25em;
}

:deep(.markdown-body hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
  width: 100%;
}

/* 响应式布局 */
@media screen and (min-width: 768px) {
  .blog-content {
    padding: 0 30px 40px;
  }

  .blog-header {
    padding: 40px 30px;
  }

  .blog-title {
    font-size: 2.2em;
  }
}

@media screen and (min-width: 1200px) {
  .blog-content {
    padding: 0 40px 40px;
  }

  .blog-header {
    padding: 50px 40px;
  }

  .blog-title {
    font-size: 2.5em;
  }
}

@media screen and (max-width: 767px) {
  .blog-header {
    padding: 20px 15px;
  }

  .blog-title {
    font-size: 1.8em;
  }

  .blog-meta {
    gap: 12px;
  }

  .blog-content {
    padding: 0 15px 20px;
  }

  :deep(.markdown-body) {
    font-size: 15px;
  }
}
</style> 