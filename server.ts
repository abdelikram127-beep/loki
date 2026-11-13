import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'library.json');

type Platform = 'youtube' | 'instagram' | 'tiktok';

interface VideoItem {
  id: string;
  url: string;
  platform: Platform;
  videoId: string;
  embedUrl: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  fallbackKey?: 'architecture' | 'design' | 'culinary';
  duration: string;
  addedAt: string;
  projectIds: string[];
  tags: string[];
  notes: string;
  isFavorite: boolean;
}

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  color: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
  videoOrder: string[];
  createdAt: string;
}

interface LibraryData {
  videos: VideoItem[];
  projects: ProjectItem[];
}

const DEFAULT_DATA: LibraryData = {
  projects: [
    {
      id: 'proj-design',
      name: 'Design & Architecture',
      description: 'Références visuelles, études d’espaces et typographie éditoriale.',
      color: 'blue',
      videoOrder: ['vid-yt-1', 'vid-ig-1'],
      createdAt: '2026-11-08T10:00:00.000Z',
    },
    {
      id: 'proj-atelier',
      name: 'Atelier & Savoir-faire',
      description: 'Tutoriels d’outillage, café de spécialité et workflows créatifs.',
      color: 'emerald',
      videoOrder: ['vid-tt-1', 'vid-yt-2'],
      createdAt: '2026-11-10T14:30:00.000Z',
    },
  ],
  videos: [
    {
      id: 'vid-yt-1',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      platform: 'youtube',
      videoId: 'aqz-KE-bpKQ',
      embedUrl: 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
      title: 'Lumière naturelle et béton brut dans l’architecture muséale',
      author: 'Atelier Spatial',
      thumbnailUrl: 'fallback:architecture',
      fallbackKey: 'architecture',
      duration: '09:56',
      addedAt: '2026-11-12T09:15:00.000Z',
      projectIds: ['proj-design'],
      tags: ['architecture', 'lumière', 'documentaire'],
      notes: 'Excellente séquence d’ouverture sur le jeu d’ombres zénithales à 02:14. À conserver comme référence de cadrage.',
      isFavorite: true,
    },
    {
      id: 'vid-ig-1',
      url: 'https://www.instagram.com/reel/C8xYzExample/',
      platform: 'instagram',
      videoId: 'C8xYzExample',
      embedUrl: 'https://www.instagram.com/reel/C8xYzExample/embed',
      title: 'Carnet de croquis industriel et ergonomie du poste de travail',
      author: '@studio.trame',
      thumbnailUrl: 'fallback:design',
      fallbackKey: 'design',
      duration: '00:54',
      addedAt: '2026-11-11T16:40:00.000Z',
      projectIds: ['proj-design'],
      tags: ['croquis', 'ergonomie', 'studio'],
      notes: 'Disposition claire du bureau avec règle graduée et clavier mécanique compact.',
      isFavorite: false,
    },
    {
      id: 'vid-tt-1',
      url: 'https://www.tiktok.com/@craftcoffee/video/7300000000000000001',
      platform: 'tiktok',
      videoId: '7300000000000000001',
      embedUrl: 'https://www.tiktok.com/embed/v2/7300000000000000001',
      title: 'Extraction V60 : ratio 1:16 et maîtrise du versement lent',
      author: '@craftcoffee',
      thumbnailUrl: 'fallback:culinary',
      fallbackKey: 'culinary',
      duration: '01:12',
      addedAt: '2026-11-10T08:20:00.000Z',
      projectIds: ['proj-atelier'],
      tags: ['café', 'extraction', 'recette'],
      notes: 'Température d’eau à 93 °C, pré-infusion de 45 secondes avec 50 g d’eau.',
      isFavorite: true,
    },
    {
      id: 'vid-yt-2',
      url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      platform: 'youtube',
      videoId: 'M7lc1UVf-VE',
      embedUrl: 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE',
      title: 'Lecteurs embarqués et intégration vidéo multi-plateformes',
      author: 'YouTube Developers',
      thumbnailUrl: 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg',
      fallbackKey: 'design',
      duration: '04:18',
      addedAt: '2026-11-09T11:05:00.000Z',
      projectIds: ['proj-atelier'],
      tags: ['développement', 'embed', 'documentation'],
      notes: 'Référence technique pour les paramètres du lecteur intégré sans cookies.',
      isFavorite: false,
    },
  ],
};

async function ensureDataFile(): Promise<LibraryData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as LibraryData;
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
    return structuredClone(DEFAULT_DATA);
  }
}

async function writeDataFile(data: LibraryData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function parseVideoUrl(rawUrl: string): { platform: Platform; videoId: string; embedUrl: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  // YouTube
  if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com')) {
    let videoId = '';
    if (host.includes('youtu.be')) {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
    } else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.split('/')[2] ?? '';
    } else if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.split('/')[2] ?? '';
    } else {
      videoId = parsed.searchParams.get('v') ?? '';
    }
    if (!videoId) return null;
    return {
      platform: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`,
    };
  }

  // Instagram
  if (host.includes('instagram.com') || host.includes('instagr.am')) {
    const parts = parsed.pathname.split('/').filter(Boolean);
    let kind = 'p';
    let code = '';
    if (parts[0] === 'reel' || parts[0] === 'reels' || parts[0] === 'p' || parts[0] === 'tv') {
      kind = parts[0] === 'reels' ? 'reel' : parts[0];
      code = parts[1] ?? '';
    }
    if (!code) {
      return {
        platform: 'instagram',
        videoId: parts[parts.length - 1] || 'post',
        embedUrl: rawUrl.trim(),
      };
    }
    return {
      platform: 'instagram',
      videoId: code,
      embedUrl: `https://www.instagram.com/${kind}/${encodeURIComponent(code)}/embed`,
    };
  }

  // TikTok
  if (host.includes('tiktok.com')) {
    const match = parsed.pathname.match(/\/video\/(\d+)/);
    const videoId = match?.[1] ?? (parsed.pathname.split('/').filter(Boolean).pop() || 'video');
    return {
      platform: 'tiktok',
      videoId,
      embedUrl: /^\d+$/.test(videoId)
        ? `https://www.tiktok.com/embed/v2/${videoId}`
        : rawUrl.trim(),
    };
  }

  return null;
}

async function fetchJsonWithTimeout(targetUrl: string, timeoutMs = 4500): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Clipotheque/1.0',
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Get full library
  app.get('/api/library', async (_req, res) => {
    try {
      const data = await ensureDataFile();
      res.json(data);
    } catch (err) {
      console.error('Error loading library:', err);
      res.status(500).json({ error: 'Impossible de charger la bibliothèque.' });
    }
  });

  // Extract metadata via official oEmbed endpoints (no scraping)
  app.post('/api/extract-metadata', async (req, res) => {
    const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Veuillez fournir un lien vidéo valide.' });
      return;
    }

    const parsed = parseVideoUrl(rawUrl);
    if (!parsed) {
      res.status(400).json({
        error: 'Lien non reconnu. Collez un lien YouTube, Instagram ou TikTok valide.',
      });
      return;
    }

    let title = '';
    let author = '';
    let thumbnailUrl = '';
    let duration = '';
    let embedUrl = parsed.embedUrl;
    let videoId = parsed.videoId;
    let oembedSuccess = false;

    if (parsed.platform === 'youtube') {
      thumbnailUrl = `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`;
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(rawUrl)}&format=json`;
      const oembed = await fetchJsonWithTimeout(oembedUrl);
      if (oembed) {
        oembedSuccess = true;
        title = typeof oembed.title === 'string' ? oembed.title : '';
        author = typeof oembed.author_name === 'string' ? oembed.author_name : '';
        if (typeof oembed.thumbnail_url === 'string') {
          thumbnailUrl = oembed.thumbnail_url;
        }
      }
      if (!title) {
        title = `Vidéo YouTube (${parsed.videoId})`;
      }
    } else if (parsed.platform === 'tiktok') {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(rawUrl)}`;
      const oembed = await fetchJsonWithTimeout(oembedUrl);
      if (oembed) {
        oembedSuccess = true;
        title = typeof oembed.title === 'string' ? oembed.title : '';
        author = typeof oembed.author_name === 'string' ? `@${oembed.author_name.replace(/^@/, '')}` : '';
        thumbnailUrl = typeof oembed.thumbnail_url === 'string' ? oembed.thumbnail_url : '';
        if (typeof oembed.embed_product_id === 'string' && /^\d+$/.test(oembed.embed_product_id)) {
          videoId = oembed.embed_product_id;
          embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
        }
      }
      if (!title) {
        title = `Vidéo TikTok (${videoId})`;
      }
    } else if (parsed.platform === 'instagram') {
      // Instagram oEmbed API requires a Meta app token in production; try optional public endpoint or fallback cleanly
      const igToken = process.env.INSTAGRAM_OEMBED_TOKEN;
      if (igToken) {
        const oembedUrl = `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(rawUrl)}&access_token=${encodeURIComponent(igToken)}`;
        const oembed = await fetchJsonWithTimeout(oembedUrl);
        if (oembed) {
          oembedSuccess = true;
          title = typeof oembed.title === 'string' ? oembed.title : '';
          author = typeof oembed.author_name === 'string' ? `@${oembed.author_name.replace(/^@/, '')}` : '';
          thumbnailUrl = typeof oembed.thumbnail_url === 'string' ? oembed.thumbnail_url : '';
        }
      }
      if (!title) {
        title = `Publication Instagram (${parsed.videoId})`;
      }
    }

    res.json({
      platform: parsed.platform,
      videoId,
      embedUrl,
      title,
      author,
      thumbnailUrl,
      duration,
      oembedSuccess,
    });
  });

  // Create video
  app.post('/api/videos', async (req, res) => {
    try {
      const data = await ensureDataFile();
      const body = req.body as Partial<VideoItem>;
      if (!body.url || !body.platform || !body.title) {
        res.status(400).json({ error: 'Lien, plateforme et titre requis.' });
        return;
      }

      const newVideo: VideoItem = {
        id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: body.url.trim(),
        platform: body.platform,
        videoId: body.videoId ?? '',
        embedUrl: body.embedUrl ?? body.url.trim(),
        title: body.title.trim(),
        author: (body.author ?? '').trim(),
        thumbnailUrl: (body.thumbnailUrl ?? '').trim(),
        duration: (body.duration ?? '').trim(),
        addedAt: new Date().toISOString(),
        projectIds: Array.isArray(body.projectIds) ? body.projectIds : [],
        tags: Array.isArray(body.tags) ? body.tags : [],
        notes: (body.notes ?? '').trim(),
        isFavorite: Boolean(body.isFavorite),
      };

      data.videos.unshift(newVideo);

      // Sync project videoOrder arrays
      for (const proj of data.projects) {
        if (newVideo.projectIds.includes(proj.id) && !proj.videoOrder.includes(newVideo.id)) {
          proj.videoOrder.unshift(newVideo.id);
        }
      }

      await writeDataFile(data);
      res.status(201).json(newVideo);
    } catch (err) {
      console.error('Error creating video:', err);
      res.status(500).json({ error: 'Erreur lors de l’enregistrement de la vidéo.' });
    }
  });

  // Update video
  app.put('/api/videos/:id', async (req, res) => {
    try {
      const data = await ensureDataFile();
      const idx = data.videos.findIndex((v) => v.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Vidéo introuvable.' });
        return;
      }

      const current = data.videos[idx];
      const updates = req.body as Partial<VideoItem>;
      const updated: VideoItem = {
        ...current,
        title: typeof updates.title === 'string' ? updates.title.trim() || current.title : current.title,
        author: typeof updates.author === 'string' ? updates.author.trim() : current.author,
        thumbnailUrl: typeof updates.thumbnailUrl === 'string' ? updates.thumbnailUrl.trim() : current.thumbnailUrl,
        duration: typeof updates.duration === 'string' ? updates.duration.trim() : current.duration,
        notes: typeof updates.notes === 'string' ? updates.notes : current.notes,
        tags: Array.isArray(updates.tags) ? updates.tags : current.tags,
        projectIds: Array.isArray(updates.projectIds) ? updates.projectIds : current.projectIds,
        isFavorite: typeof updates.isFavorite === 'boolean' ? updates.isFavorite : current.isFavorite,
      };

      data.videos[idx] = updated;

      // Sync project videoOrder memberships
      for (const proj of data.projects) {
        const shouldContain = updated.projectIds.includes(proj.id);
        const alreadyContains = proj.videoOrder.includes(updated.id);
        if (shouldContain && !alreadyContains) {
          proj.videoOrder.push(updated.id);
        } else if (!shouldContain && alreadyContains) {
          proj.videoOrder = proj.videoOrder.filter((id) => id !== updated.id);
        }
      }

      await writeDataFile(data);
      res.json(updated);
    } catch (err) {
      console.error('Error updating video:', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
    }
  });

  // Delete video
  app.delete('/api/videos/:id', async (req, res) => {
    try {
      const data = await ensureDataFile();
      const exists = data.videos.some((v) => v.id === req.params.id);
      if (!exists) {
        res.status(404).json({ error: 'Vidéo introuvable.' });
        return;
      }

      data.videos = data.videos.filter((v) => v.id !== req.params.id);
      for (const proj of data.projects) {
        proj.videoOrder = proj.videoOrder.filter((id) => id !== req.params.id);
      }

      await writeDataFile(data);
      res.json({ ok: true });
    } catch (err) {
      console.error('Error deleting video:', err);
      res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
  });

  // Create project
  app.post('/api/projects', async (req, res) => {
    try {
      const data = await ensureDataFile();
      const body = req.body as Partial<ProjectItem>;
      if (!body.name?.trim()) {
        res.status(400).json({ error: 'Le nom du projet est obligatoire.' });
        return;
      }

      const newProject: ProjectItem = {
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: body.name.trim(),
        description: (body.description ?? '').trim(),
        color: body.color ?? 'blue',
        videoOrder: [],
        createdAt: new Date().toISOString(),
      };

      data.projects.push(newProject);
      await writeDataFile(data);
      res.status(201).json(newProject);
    } catch (err) {
      console.error('Error creating project:', err);
      res.status(500).json({ error: 'Erreur lors de la création du projet.' });
    }
  });

  // Update project
  app.put('/api/projects/:id', async (req, res) => {
    try {
      const data = await ensureDataFile();
      const idx = data.projects.findIndex((p) => p.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Projet introuvable.' });
        return;
      }

      const current = data.projects[idx];
      const updates = req.body as Partial<ProjectItem>;
      const updated: ProjectItem = {
        ...current,
        name: typeof updates.name === 'string' && updates.name.trim() ? updates.name.trim() : current.name,
        description: typeof updates.description === 'string' ? updates.description.trim() : current.description,
        color: updates.color ?? current.color,
        videoOrder: Array.isArray(updates.videoOrder) ? updates.videoOrder : current.videoOrder,
      };

      data.projects[idx] = updated;
      await writeDataFile(data);
      res.json(updated);
    } catch (err) {
      console.error('Error updating project:', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du projet.' });
    }
  });

  // Reorder videos within a project
  app.put('/api/projects/:id/reorder', async (req, res) => {
    try {
      const data = await ensureDataFile();
      const proj = data.projects.find((p) => p.id === req.params.id);
      if (!proj) {
        res.status(404).json({ error: 'Projet introuvable.' });
        return;
      }

      const order = Array.isArray(req.body?.videoOrder) ? (req.body.videoOrder as string[]) : null;
      if (!order) {
        res.status(400).json({ error: 'Ordre invalide.' });
        return;
      }

      proj.videoOrder = order;
      await writeDataFile(data);
      res.json(proj);
    } catch (err) {
      console.error('Error reordering project:', err);
      res.status(500).json({ error: 'Erreur lors de la réorganisation.' });
    }
  });

  // Delete project
  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const data = await ensureDataFile();
      const exists = data.projects.some((p) => p.id === req.params.id);
      if (!exists) {
        res.status(404).json({ error: 'Projet introuvable.' });
        return;
      }

      data.projects = data.projects.filter((p) => p.id !== req.params.id);
      for (const vid of data.videos) {
        vid.projectIds = vid.projectIds.filter((id) => id !== req.params.id);
      }

      await writeDataFile(data);
      res.json({ ok: true });
    } catch (err) {
      console.error('Error deleting project:', err);
      res.status(500).json({ error: 'Erreur lors de la suppression du projet.' });
    }
  });

  // Vite middleware or production static assets
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clipothèque server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
