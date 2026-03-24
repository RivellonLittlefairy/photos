import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { createPhoto, removeUploadedFile, uploadPhotoFiles } from "../api/photos";

type UploadStatus = "ready" | "uploading" | "uploaded" | "error";

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

function getCapturedAt(dateValue: string): string | undefined {
  if (dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return undefined;
}

function statusText(item: UploadQueueItem): string {
  if (item.status === "uploading") {
    return `正在上传 ${Math.round(item.progress)}%`;
  }
  if (item.status === "uploaded") {
    return "已上传";
  }
  if (item.status === "error") {
    return item.error ?? "上传失败";
  }
  return "已就绪";
}

function statusClass(item: UploadQueueItem): string {
  if (item.status === "uploading") {
    return "upload-status uploading";
  }
  if (item.status === "uploaded") {
    return "upload-status uploaded";
  }
  if (item.status === "error") {
    return "upload-status error";
  }
  return "upload-status ready";
}

function progressClass(item: UploadQueueItem): string {
  if (item.status === "uploaded") {
    return "upload-progress-fill uploaded";
  }
  if (item.status === "error") {
    return "upload-progress-fill error";
  }
  return "upload-progress-fill";
}

function buildQueueItems(files: File[]): UploadQueueItem[] {
  return files.map((file) => {
    const isValidType = ACCEPTED_MIME_TYPES.has(file.type);
    const isValidSize = file.size <= MAX_FILE_SIZE;

    let status: UploadStatus = "ready";
    let error: string | undefined;

    if (!isValidType) {
      status = "error";
      error = "文件格式不支持";
    } else if (!isValidSize) {
      status = "error";
      error = "单张图片不能超过 20MB";
    }

    return {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status,
      progress: 0,
      error
    };
  });
}

export function UploadPage() {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [stage, setStage] = useState("");
  const [capturedDate, setCapturedDate] = useState("");
  const [tags, setTags] = useState<string[]>(["旅行", "风景"]);
  const [tagInput, setTagInput] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "family">("private");
  const [dragActive, setDragActive] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queueRef = useRef<UploadQueueItem[]>([]);

  const readyCount = queue.filter((item) => item.status === "ready").length;
  const uploadingCount = queue.filter((item) => item.status === "uploading").length;
  const uploadedCount = queue.filter((item) => item.status === "uploaded").length;
  const errorCount = queue.filter((item) => item.status === "error").length;
  const uploading = uploadingCount > 0;

  const preparedBytes = queue
    .filter((item) => item.status === "ready" || item.status === "uploading")
    .reduce((total, item) => total + item.file.size, 0);

  function revokeItemPreview(item: UploadQueueItem): void {
    if (item.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      for (const item of queueRef.current) {
        revokeItemPreview(item);
      }
    };
  }, []);

  function appendFiles(files: File[]): void {
    if (!files.length) {
      return;
    }

    setSubmitError(null);
    const nextItems = buildQueueItems(files);
    setQueue((prev) => [...prev, ...nextItems]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragActive(false);
    appendFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>): void {
    appendFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleRemoveItem(id: string): void {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        revokeItemPreview(target);
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function handleClearQueue(): void {
    setQueue((prev) => {
      for (const item of prev) {
        revokeItemPreview(item);
      }
      return [];
    });
    setSubmitError(null);
  }

  function updateQueueItem(id: string, patch: Partial<UploadQueueItem>): void {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addTag(rawTag: string): void {
    const tag = rawTag.trim();
    if (!tag) {
      return;
    }
    if (tags.includes(tag)) {
      return;
    }
    setTags((prev) => [...prev, tag]);
  }

  async function handleUpload(): Promise<void> {
    if (uploading) {
      return;
    }

    const readyItems = queue.filter((item) => item.status === "ready");
    if (!readyItems.length) {
      setSubmitError("当前没有可上传的图片");
      return;
    }

    setSubmitError(null);

    for (const item of readyItems) {
      updateQueueItem(item.id, { status: "uploading", progress: 20, error: undefined });
      let uploadedFilename: string | null = null;

      try {
        const [uploaded] = await uploadPhotoFiles([item.file]);
        uploadedFilename = uploaded.filename;
        updateQueueItem(item.id, { progress: 70 });

        await createPhoto({
          url: uploaded.url,
          capturedAt: getCapturedAt(capturedDate),
          stage: stage || undefined,
          tags,
          privacy
        });

        updateQueueItem(item.id, { status: "uploaded", progress: 100 });
      } catch (error) {
        if (uploadedFilename) {
          void removeUploadedFile(uploadedFilename).catch(() => {
            // orphan cleanup best effort
          });
        }
        const message = error instanceof Error ? error.message : "上传失败";
        updateQueueItem(item.id, { status: "error", progress: 0, error: message });
      }
    }
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    addTag(tagInput);
    setTagInput("");
  }

  return (
    <section className="page-shell page-upload">
      <main className="upload-layout">
        <section className="upload-main">
          <header className="upload-head">
            <h1>添加新记忆</h1>
            <p>将您的珍贵瞬间永久保存到档案馆中。</p>
          </header>

          <div
            className={dragActive ? "upload-dropzone active" : "upload-dropzone"}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className="upload-drop-icon">
              <span className="material-symbols-outlined">cloud_upload</span>
            </div>
            <h2>
              拖拽图片到这里，或者 <span>点击上传</span>
            </h2>
            <p>支持 JPG, PNG, HEIC, WEBP 格式（最大 20MB）</p>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
              multiple
              onChange={handleSelectFiles}
            />
          </div>

          <section className="upload-queue">
            <header>
              <h2>等待上传 ({readyCount + uploadingCount})</h2>
              <button type="button" onClick={handleClearQueue} disabled={uploading}>
                清空列表
              </button>
            </header>

            <div className="upload-queue-list">
              {queue.map((item) => (
                <article key={item.id} className={item.status === "error" ? "upload-item error" : "upload-item"}>
                  <div className="upload-thumb">
                    {item.status === "error" ? (
                      <span className="material-symbols-outlined">image_not_supported</span>
                    ) : (
                      <img src={item.previewUrl} alt={item.file.name} />
                    )}
                  </div>

                  <div className="upload-item-body">
                    <div className="upload-item-head">
                      <h3>{item.file.name}</h3>
                      <small>{formatBytes(item.file.size)}</small>
                    </div>

                    <div className="upload-progress">
                      <div className={progressClass(item)} style={{ width: `${item.progress}%` }} />
                    </div>
                    <p className={statusClass(item)}>{statusText(item)}</p>
                  </div>

                  <button type="button" className="upload-delete-btn" onClick={() => handleRemoveItem(item.id)} disabled={uploading}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </article>
              ))}
              {!queue.length ? <p className="upload-empty">还没有待上传图片，先把你的第一段记忆放进来。</p> : null}
            </div>
          </section>
        </section>

        <aside className="upload-side">
          <div className="upload-side-card">
            <div className="upload-side-title">
              <span className="material-symbols-outlined">settings_suggest</span>
              <h2>批量设置</h2>
            </div>

            <label className="upload-field">
              <span>所属相册</span>
              <select value={stage} onChange={(event) => setStage(event.target.value)}>
                <option value="">自动按拍摄月份分组</option>
                <option value="2024 夏季旅行">2024 夏季旅行</option>
                <option value="家庭聚会">家庭聚会</option>
                <option value="默认相册">默认相册</option>
                <option value="自然风景">自然风景</option>
              </select>
            </label>

            <label className="upload-field">
              <span>拍摄时间</span>
              <input type="date" value={capturedDate} onChange={(event) => setCapturedDate(event.target.value)} />
              <small className="upload-field-hint">不填写则自动读取照片 EXIF 拍摄时间</small>
            </label>

            <div className="upload-field">
              <span>全局标签</span>
              <input
                type="text"
                placeholder="输入标签按回车添加..."
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  addTag(tagInput);
                  setTagInput("");
                }}
              />
              <div className="upload-tag-list">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="upload-tag"
                    onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                  >
                    #{tag}
                    <span className="material-symbols-outlined">close</span>
                  </button>
                ))}
              </div>
            </div>

            <section className="upload-privacy">
              <h3>访问权限</h3>
              <label>
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === "private"}
                  onChange={() => setPrivacy("private")}
                />
                <div>
                  <strong>仅自己可见</strong>
                  <p>该记忆仅存放于您的私人档案。</p>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === "family"}
                  onChange={() => setPrivacy("family")}
                />
                <div>
                  <strong>家人共享</strong>
                  <p>选定的家人可以查看和评论。</p>
                </div>
              </label>
            </section>

            <section className="upload-tip">
              <span className="material-symbols-outlined">lightbulb</span>
              <p>
                <strong>温馨提示：</strong> 上传高分辨率图片可能需要较长时间，请保持页面开启。
              </p>
            </section>
          </div>
        </aside>
      </main>

      <footer className="upload-footer">
        <div className="upload-footer-left">
          <div className="upload-counter-stack">
            <span className="uploaded">{uploadedCount}</span>
            <span className="ready">{readyCount + uploadingCount}</span>
            <span className="error">{errorCount}</span>
          </div>
          <p>已准备 {readyCount + uploadingCount} 张图片，共 {formatBytes(preparedBytes)}</p>
        </div>

        <div className="upload-footer-actions">
          <button type="button" className="ghost-btn" onClick={handleClearQueue} disabled={uploading}>
            取消
          </button>
          <button type="button" className="primary-btn" onClick={() => void handleUpload()} disabled={uploading || readyCount === 0}>
            {uploading ? "上传中..." : "开始上传"}
          </button>
        </div>
      </footer>

      {submitError ? <p className="upload-submit-error">{submitError}</p> : null}
    </section>
  );
}
