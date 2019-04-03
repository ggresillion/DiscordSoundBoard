import {Component, Inject, OnInit} from '@angular/core';
import {CategoryService} from '../../../category/category.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-create-category-dialog',
  templateUrl: './create-category-dialog.component.html',
  styleUrls: ['./create-category-dialog.component.scss']
})
export class CreateCategoryDialogComponent implements OnInit {

  public categoryName: string = "";

  constructor(public dialogRef: MatDialogRef<CreateCategoryDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private categoryService: CategoryService) {
  }

  ngOnInit() {
  }

  createCategory() {
    this.categoryService.createCategory(this.categoryName).subscribe(() => {
      this.dialogRef.close();
    });
  }
}