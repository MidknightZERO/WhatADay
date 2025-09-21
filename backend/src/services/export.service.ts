import { supabase, incrementUsage, checkSubscriptionLimits } from '../lib/supabase';
import type { Export, CreateExportRequest, ExportFormat } from '../types/database';

export class ExportService {
  async createExport(
    userId: string,
    request: CreateExportRequest
  ): Promise<Export> {
    // Check subscription limits
    const limits = await checkSubscriptionLimits(userId, 'exports');
    if (!limits.allowed) {
      throw new Error(`Daily export limit exceeded. Limit: ${limits.limit}, Current: ${limits.current}`);
    }

    // Verify transcription belongs to user
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('id, text, status')
      .eq('id', request.transcription_id)
      .eq('user_id', userId)
      .single();

    if (transcriptionError || !transcription) {
      throw new Error('Transcription not found');
    }

    if (transcription.status !== 'completed') {
      throw new Error('Transcription is not completed');
    }

    if (!transcription.text) {
      throw new Error('Transcription text is empty');
    }

    // Generate content based on format
    const { content, metadata } = await this.generateContent(
      transcription.text,
      request.format,
      request.options || {}
    );

    // Create export record
    const { data, error } = await supabase
      .from('exports')
      .insert({
        transcription_id: request.transcription_id,
        user_id: userId,
        format: request.format,
        content,
        metadata,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create export: ${error.message}`);
    }

    // Increment usage
    await incrementUsage(userId, 'exports');

    return data;
  }

  async getExports(
    userId: string,
    page: number = 1,
    limit: number = 10,
    transcriptionId?: string,
    format?: ExportFormat
  ): Promise<{ exports: Export[]; pagination: any }> {
    let query = supabase
      .from('exports')
      .select('*, transcriptions(*, recordings(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (transcriptionId) {
      query = query.eq('transcription_id', transcriptionId);
    }

    if (format) {
      query = query.eq('format', format);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch exports: ${error.message}`);
    }

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data?.slice(startIndex, endIndex) || [];

    return {
      exports: paginatedData,
      pagination: {
        page,
        limit,
        total: data?.length || 0,
        totalPages: Math.ceil((data?.length || 0) / limit),
      },
    };
  }

  async getExport(userId: string, exportId: string): Promise<Export> {
    const { data, error } = await supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch export: ${error.message}`);
    }

    return data;
  }

  private async generateContent(
    text: string,
    format: ExportFormat,
    options: Record<string, any>
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    switch (format) {
      case 'twitter':
        return this.generateTwitterContent(text, options);
      case 'twitlonger':
        return this.generateTwitlongerContent(text, options);
      case 'youtube':
        return this.generateYouTubeContent(text, options);
      case 'tiktok':
        return this.generateTikTokContent(text, options);
      case 'blog':
        return this.generateBlogContent(text, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async generateTwitterContent(
    text: string,
    _options: Record<string, any>
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    const maxLength = _options['max_length'] || 140;
    const includeHashtags = _options['include_hashtags'] !== false;
    
    // Simple truncation (in real app, use AI to summarize)
    let content = text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    
    if (includeHashtags) {
      content += ' #WhatADay #AI #Content';
    }

    return {
      content,
      metadata: {
        character_count: content.length,
        hashtags: includeHashtags ? ['#WhatADay', '#AI', '#Content'] : [],
      },
    };
  }

  private async generateTwitlongerContent(
    text: string,
    _options: Record<string, any>
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    return {
      content: text,
      metadata: {
        character_count: text.length,
        word_count: text.split(' ').length,
      },
    };
  }

  private async generateYouTubeContent(
    text: string,
    _options: Record<string, any>
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    const includeHook = _options['include_hook'] !== false;
    const includeOutro = _options['include_outro'] !== false;
    
    let content = '';
    
    if (includeHook) {
      content += `🎬 HOOK: ${text.substring(0, 100)}...\n\n`;
    }
    
    content += `📝 MAIN CONTENT:\n${text}\n\n`;
    
    if (includeOutro) {
      content += `🎯 OUTRO: Thanks for watching! Don't forget to like and subscribe for more content like this!`;
    }

    return {
      content,
      metadata: {
        hook: includeHook ? text.substring(0, 100) + '...' : undefined,
        outro: includeOutro ? 'Thanks for watching! Don\'t forget to like and subscribe!' : undefined,
        estimated_duration: Math.ceil(text.split(' ').length / 3), // Rough estimate: 3 words per second
      },
    };
  }

  private async generateTikTokContent(
    text: string,
    _options: Record<string, any>
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    // Split content into 15-second segments for TikTok
    const words = text.split(' ');
    const wordsPerSegment = 45; // ~15 seconds at 3 words per second
    const segments = [];
    
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      segments.push(words.slice(i, i + wordsPerSegment).join(' '));
    }

    const content = segments.map((segment, index) => 
      `🎬 Segment ${index + 1} (0:${index * 15}-0:${(index + 1) * 15}):\n${segment}`
    ).join('\n\n');

    const shotList = segments.map((segment, index) => ({
      timestamp: `${index * 15}s-${(index + 1) * 15}s`,
      description: segment.substring(0, 50) + '...',
      duration: 15,
    }));

    return {
      content,
      metadata: {
        shot_list: shotList,
        total_segments: segments.length,
        estimated_duration: segments.length * 15,
      },
    };
  }

  private async generateBlogContent(
    text: string,
    _options: Record<string, any>
  ): Promise<{ content: string; metadata: Record<string, any> }> {
    const title = _options['title'] || 'Generated Blog Post';
    
    const content = `# ${title}

## Introduction
${text.substring(0, 200)}...

## Main Content
${text}

## Conclusion
${text.substring(text.length - 200)}...

---

*This blog post was generated using WhatADay AI technology.*`;

    const imagePlaceholders = [
      { position: 'header', description: 'Hero image related to the topic' },
      { position: 'middle', description: 'Supporting image or infographic' },
      { position: 'footer', description: 'Call-to-action image' },
    ];

    return {
      content,
      metadata: {
        title,
        image_placeholders: imagePlaceholders,
        estimated_read_time: Math.ceil(text.split(' ').length / 200), // 200 words per minute
        word_count: text.split(' ').length,
      },
    };
  }
}


