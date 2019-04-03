import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {SoundService} from '../../sound.service';

@Component({
  selector: 'app-add-from-youtube-dialog',
  templateUrl: './add-from-youtube-dialog.component.html',
  styleUrls: ['./add-from-youtube-dialog.component.scss']
})
export class AddFromYoutubeDialogComponent implements OnInit {

  public videoURL = '';
  public videoInfos: any;
  public loading = false;
  public uploadName = '';

  constructor(public dialogRef: MatDialogRef<AddFromYoutubeDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private songService: SoundService) {
  }

  ngOnInit() {
  }

  public search() {
    this.loading = true;
    this.songService.searchYoutube(this.videoURL).subscribe((info) => {
      this.videoInfos = info;
      this.loading = false;
    }, () => {
      this.loading = false;
    });
  }

  public upload() {
    this.loading = true;
    this.songService.uploadFromYoutube(this.videoURL, this.data.category, this.uploadName).subscribe(() => {
      this.dialogRef.close();
    });
  }
}