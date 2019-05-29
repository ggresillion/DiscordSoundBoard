import {BadRequestException, Controller, Get, Post, Query} from '@nestjs/common';
import {YoutubeService} from './youtube.service';
import {Info} from 'youtube-dl';
import {Body} from '@nestjs/common/decorators/http/route-params.decorator';
import {UploadDto} from './dto/upload.dto';
import {VideoInfos} from '../../client/src/app/sound/model/video-infos';

@Controller('youtube')
export class YoutubeController {

  constructor(
    private readonly youtubeService: YoutubeService,
  ) {
  }

  @Get('infos')
  public async getFromYoutube(@Query('url') url: string): Promise<VideoInfos> {
    const id = url.split('v=')[1];
    return await this.youtubeService.fetchVideoInfos(id);
  }

  @Get('search')
  public async searchOnYoutube(@Query('q') q: string): Promise<VideoInfos[]> {
    return await this.youtubeService.searchVideos(q);
  }

  @Post('upload')
  public async uploadFromYoutube(@Body()upload: UploadDto): Promise<any> {
    return await this.youtubeService.uploadFromYoutube(upload.url, upload.name, upload.categoryId);
  }

  @Post('play')
  public async playSoundFromYoutube(@Query('url') url: string) {
    if (!url || url === '') {
      throw new BadRequestException();
    }
    return await this.youtubeService.playSoundFromYoutube(url);
  }
}
