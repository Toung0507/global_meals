import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-entry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-entry.component.html',
  styleUrls: ['./qr-entry.component.scss'],
})
export class QrEntryComponent implements OnInit {
  status: 'loading' | 'invalid' = 'loading';
  tableId = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const branch = this.route.snapshot.queryParamMap.get('branch');
    const table = this.route.snapshot.queryParamMap.get('table') ?? '';
    this.tableId = table;

    const branchId = Number(branch);
    if (!branch || isNaN(branchId) || branchId <= 0) {
      /* 無效分店 → 導回通用訪客入口 */
      this.router.navigate(['/customer-guest']);
      return;
    }

    /* 有效 → 存入 sessionStorage，品牌動畫後跳轉 */
    sessionStorage.setItem('qr_branch', String(branchId));
    sessionStorage.setItem('qr_table', table);

    setTimeout(() => {
      this.router.navigate(['/customer-guest']);
    }, 1400);
  }
}
