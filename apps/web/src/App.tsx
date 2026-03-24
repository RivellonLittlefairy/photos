import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { StudioLayout } from "./layout/StudioLayout";
import { InfoPage } from "./pages/InfoPage";
import { MemoryTimelinePage } from "./pages/MemoryTimelinePage";
import { PhotoStoryPage } from "./pages/PhotoStoryPage";
import { SmartAlbumsPage } from "./pages/SmartAlbumsPage";
import { UploadPage } from "./pages/UploadPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StudioLayout />}>
          <Route index element={<MemoryTimelinePage />} />
          <Route path="timeline" element={<Navigate to="/" replace />} />
          <Route path="albums" element={<SmartAlbumsPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route
            path="legal/privacy"
            element={
              <InfoPage
                title="隐私政策"
                description="我们只处理你上传到时光档案中的必要数据，并用于照片管理与回放。"
                sections={[
                  {
                    heading: "数据范围",
                    content: "系统存储图片文件与照片元数据（标题、标签、拍摄时间、阶段），用于提供时间轴和相册能力。"
                  },
                  {
                    heading: "数据保存",
                    content: "本地部署模式下，图片保存在本机磁盘，数据库保存结构化信息。你可随时删除照片，系统会同步清理本地文件。"
                  },
                  {
                    heading: "联系方式",
                    content: "如需进一步说明，请通过项目维护渠道提交 issue 或反馈。"
                  }
                ]}
              />
            }
          />
          <Route
            path="legal/terms"
            element={
              <InfoPage
                title="使用条款"
                description="使用时光档案前，请先阅读以下条款。"
                sections={[
                  {
                    heading: "内容责任",
                    content: "你应确保上传内容拥有合法使用权，不得上传违法或侵权图片。"
                  },
                  {
                    heading: "服务限制",
                    content: "系统当前主要面向个人照片管理，不提供多租户隔离和企业级审计能力。"
                  },
                  {
                    heading: "功能更新",
                    content: "我们会持续迭代功能，必要时会调整接口与页面结构。"
                  }
                ]}
              />
            }
          />
          <Route
            path="about"
            element={
              <InfoPage
                title="关于我们"
                description="时光档案（The Living Archive）致力于让照片从“文件”变成“故事”。"
                sections={[
                  {
                    heading: "产品理念",
                    content: "以时间线为核心，把同一阶段的照片聚合展示，帮助你重建记忆上下文。"
                  },
                  {
                    heading: "当前技术栈",
                    content: "前端 React + Vite，后端 Node.js + Express + MongoDB，支持本地磁盘存储与 Docker 部署。"
                  }
                ]}
              />
            }
          />
        </Route>
        <Route path="story/:photoId" element={<PhotoStoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
