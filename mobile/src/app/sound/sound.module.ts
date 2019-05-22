import {NgModule} from '@angular/core';
import {SoundService} from './sound.service';
import {SoundComponent} from './sound.component';
import {SharedModule} from '../shared/shared.module';
import {UploadSoundDialogComponent} from './dialogs/upload-sound-dialog/upload-sound-dialog.component';
import {AddFromYoutubeDialogComponent} from './dialogs/add-from-youtube-dialog/add-from-youtube-dialog.component';
import {CreateCategoryDialogComponent} from './dialogs/create-category-dialog/create-category-dialog.component';
import {RenameCategoryDialogComponent} from './dialogs/rename-category-dialog/rename-category-dialog.component';
import {RouterModule} from '@angular/router';

@NgModule({
  declarations: [
    SoundComponent,
    UploadSoundDialogComponent,
    AddFromYoutubeDialogComponent,
    CreateCategoryDialogComponent,
    RenameCategoryDialogComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: SoundComponent,
      }
    ])
  ],
  providers: [SoundService],
  exports: [SoundComponent],
  entryComponents: [
    UploadSoundDialogComponent,
    AddFromYoutubeDialogComponent,
    CreateCategoryDialogComponent,
    RenameCategoryDialogComponent,
  ],
})
export class SoundModule {
}
