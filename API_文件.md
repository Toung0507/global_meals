{
  "openapi": "3.1.0",
  "info": {
    "title": "OpenAPI definition",
    "version": "v0"
  },
  "servers": [
    {
      "url": "http://localhost:8080",
      "description": "Generated server url"
    }
  ],
  "tags": [
    {
      "name": "折抵管理模組",
      "description": "處理各國折抵上限(usage_cap)與消費累積次數(count)的新增、查詢、修改、刪除"
    },
    {
      "name": "商品管理模組",
      "description": "提供商品 CRUD、圖片上傳及銷售報表查詢"
    },
    {
      "name": "分店庫存管理模組",
      "description": "處理分店庫存的更新、查詢及菜單相關業務"
    },
    {
      "name": "區域稅務管理模組",
      "description": "處理國家稅率設定、使用上限與稅務清單查詢"
    },
    {
      "name": "促銷活動管理模組",
      "description": "處理促銷活動增刪改查、贈品規則及結帳金額計算"
    },
    {
      "name": "訂單管理模組",
      "description": "處理訂單查詢、建立、狀態更新及第三方金流串接"
    },
    {
      "name": "會員管理模組",
      "description": "處理會員註冊、登入、登出及密碼變更業務"
    },
    {
      "name": "匯率管理模組",
      "description": "提供匯率歷史紀錄查詢與指定日期匯率查詢"
    },
    {
      "name": "購物車管理模組",
      "description": "處理購物車增刪改查、贈品選擇及跨分店切換業務"
    },
    {
      "name": "報表管理模組",
      "description": "處理財務報表、營業額查詢等分析數據"
    },
    {
      "name": "AI 智能輔助模組",
      "description": "提供自動化文案生成、行銷內容設計等相關 API"
    },
    {
      "name": "分店管理模組",
      "description": "提供分店的新增、更新、刪除與列表查詢功能"
    },
    {
      "name": "員工管理模組",
      "description": "處理員工登入、權限管理與密碼變更業務"
    }
  ],
  "paths": {
    "/lazybaobao/staff/auth/login": {
      "post": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "員工登入",
        "description": "驗證帳號密碼並建立 Session",
        "operationId": "login",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginStaffReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/admin/staff": {
      "get": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "查詢員工清單",
        "description": "取得員工列表",
        "operationId": "getStaffList",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "新增員工",
        "description": "建立新員工帳號 (需管理員權限)",
        "operationId": "register",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegisterStaffReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/reports/get_revenue_reports": {
      "post": {
        "tags": [
          "報表管理模組"
        ],
        "summary": "查詢每日營業額",
        "description": "取得特定期間內，以「天」為單位的營業額明細",
        "operationId": "getRevenueReports",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RevenueQueryReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/RevenueQueryRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/reports/find_monthly_reports_by_date_range": {
      "post": {
        "tags": [
          "報表管理模組"
        ],
        "summary": "查詢月份區間報表",
        "description": "查詢特定月份區間的營業額分析",
        "operationId": "findMonthlyReportByDateRange",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MonthRangeReportsReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MonthRangeReportsRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/reports/find_monthly_reports": {
      "post": {
        "tags": [
          "報表管理模組"
        ],
        "summary": "查詢月度報表",
        "description": "查詢指定月份的營業額，通常包含該月與上個月的對比數據",
        "operationId": "findMonthlyReports",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MonthlyReportReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MonthlyReportRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/regions/update": {
      "post": {
        "tags": [
          "區域稅務管理模組"
        ],
        "summary": "更新國家基本設定",
        "description": "修改指定國家的基本設定",
        "operationId": "updateUsageCap",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateRegionsReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/regions/insert": {
      "post": {
        "tags": [
          "區域稅務管理模組"
        ],
        "summary": "新增國家稅值與折扣上限",
        "description": "新增國家稅務設定與國家折扣上限",
        "operationId": "insert",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateRegionsReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/uploadImage/{id}": {
      "post": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "上傳活動圖片",
        "description": "為指定促銷活動上傳宣傳圖片",
        "operationId": "uploadImage",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "活動 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "image": {
                    "type": "string",
                    "format": "binary",
                    "description": "圖片檔案"
                  }
                },
                "required": [
                  "image"
                ]
              }
            }
          }
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/toggle": {
      "post": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "啟用/停用活動",
        "description": "切換活動狀態 (開啟/關閉)",
        "operationId": "toggle",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PromotionsManageReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/getAvailableGifts": {
      "post": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "查詢可選贈品",
        "description": "根據消費金額查詢符合條件的贈品清單",
        "operationId": "getAvailableGifts",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "number"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/GiftItemVo"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/deactivateGift/{id}": {
      "post": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "關閉單一贈品",
        "description": "將指定贈品的 is_active 設為 0（不可回復）",
        "operationId": "deactivateGift",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "贈品 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/create": {
      "post": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "建立促銷活動",
        "description": "建立活動並同時上傳活動圖片（必填），選擇性設定一筆贈品規則",
        "operationId": "create",
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "$ref": "#/components/schemas/PromotionsManageReq"
                  },
                  "image": {
                    "type": "string",
                    "format": "binary"
                  }
                },
                "required": [
                  "data",
                  "image"
                ]
              }
            }
          }
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/calculate": {
      "post": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "計算結帳金額",
        "description": "結帳時套用折扣、檢查贈品並計算最終總額",
        "operationId": "calculate",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PromotionsReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PromotionsRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/addPromotionGift": {
      "post": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "新增贈品規則",
        "description": "對已存在的促銷活動補加贈品條件",
        "operationId": "addPromotionGift",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PromotionsManageReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/update": {
      "post": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "更新商品",
        "description": "修改商品資訊，可選是否同時更換圖片",
        "operationId": "updateProduct",
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "$ref": "#/components/schemas/ProductUpdateReq"
                  },
                  "file": {
                    "type": "string",
                    "format": "binary",
                    "description": "新商品圖片 (選填)"
                  }
                },
                "required": [
                  "data"
                ]
              },
              "encoding": {
                "data": {
                  "contentType": "application/json"
                }
              }
            }
          }
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminProductRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/delete/{id}": {
      "post": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "刪除商品",
        "description": "執行商品的軟刪除操作",
        "operationId": "deleteProduct",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "要刪除的商品 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminProductRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/create": {
      "post": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "新增商品",
        "description": "上傳商品圖片並新增商品基本資料",
        "operationId": "createProduct",
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "$ref": "#/components/schemas/ProductCreateReq"
                  },
                  "file": {
                    "type": "string",
                    "format": "binary",
                    "description": "商品圖片"
                  }
                },
                "required": [
                  "data",
                  "file"
                ]
              },
              "encoding": {
                "data": {
                  "contentType": "application/json"
                }
              }
            }
          }
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminProductRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/payment/callback": {
      "post": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "金流回呼通知",
        "description": "接收綠界等第三方金流的付款結果回傳 (內部 API)",
        "operationId": "handlePaymentNotify",
        "parameters": [
          {
            "name": "arg0",
            "in": "query",
            "required": true,
            "schema": {
              "type": "object",
              "additionalProperties": {
                "type": "string"
              }
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/pay_POS": {
      "post": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "POS機結帳",
        "description": "POS成立訂單並結帳成功",
        "operationId": "payForPOS",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PayForPOSReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/pay": {
      "post": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "線上付款確認",
        "description": "紀錄訂單已線上付款",
        "operationId": "pay",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PayReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/orders_status": {
      "post": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "更改訂單狀態",
        "description": "將訂單狀態更新為 READY (餐點完成/待取餐) 或 PICKED_UP (已取餐)",
        "operationId": "UpdateOrdersStatus",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateOrdersStatusReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/create_orders": {
      "post": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "建立新訂單",
        "description": "新增一筆未結帳的訂單",
        "operationId": "createOrders",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateOrdersReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/CreateOrdersRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/cash_confirm": {
      "post": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "現金付款確認",
        "description": "紀錄訂單已使用現金完成付款",
        "operationId": "cashPayOnSite",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CashPayOnSiteReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/members/update-password": {
      "post": {
        "tags": [
          "會員管理模組"
        ],
        "summary": "修改密碼",
        "description": "更新會員登入密碼",
        "operationId": "updatePassword",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdatePasswordReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/members/register_member": {
      "post": {
        "tags": [
          "會員管理模組"
        ],
        "summary": "會員註冊",
        "description": "建立正式會員帳號",
        "operationId": "registerMember",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegisterMembersReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/members/register_guest": {
      "post": {
        "tags": [
          "會員管理模組"
        ],
        "summary": "訪客註冊",
        "description": "建立訪客帳號",
        "operationId": "registerGuest",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegisterMembersReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/members/login": {
      "post": {
        "tags": [
          "會員管理模組"
        ],
        "summary": "會員登入",
        "description": "會員登入並建立 Session",
        "operationId": "login_1",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginMembersReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MembersRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/inventory/update": {
      "post": {
        "tags": [
          "分店庫存管理模組"
        ],
        "summary": "批次更新分店相關資料",
        "description": "接收一組分店更新商品請求，批次調整商品在分店中的數量、價格、最大購買量",
        "operationId": "updateInventory",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/BranchInventoryUpdateReq"
                }
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BranchInventoryRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/global-area/update": {
      "post": {
        "tags": [
          "分店管理模組"
        ],
        "summary": "修改分店資訊",
        "description": "根據分店 ID 更新其基本資料",
        "operationId": "update",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateGlobalAreaReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/global-area/delete": {
      "post": {
        "tags": [
          "分店管理模組"
        ],
        "summary": "刪除分店",
        "description": "將指定分店從系統中刪除",
        "operationId": "delete",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DeleteGlobalAreaReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/global-area/create": {
      "post": {
        "tags": [
          "分店管理模組"
        ],
        "summary": "新增分店",
        "description": "在系統中建立一個新的營業分店",
        "operationId": "create_1",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateGlobalAreaReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/exchange-rates/get_rates_by_date": {
      "post": {
        "tags": [
          "匯率管理模組"
        ],
        "summary": "依日期查詢匯率",
        "description": "根據傳入的日期參數查詢當日匯率清單",
        "operationId": "getAllByDate",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ExchangeRatesReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ExchangeRatesRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/discount/update-usage-cap": {
      "post": {
        "tags": [
          "折抵管理模組"
        ],
        "summary": "修改折抵上限",
        "description": "修改指定 discount 的 usage_cap（需帶入 id 與新的 usageCap）",
        "operationId": "updateUsageCap_1",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DiscountReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/discount/update-discount": {
      "post": {
        "tags": [
          "折抵管理模組"
        ],
        "summary": "修改優惠券設定",
        "description": "同時修改指定 discount 的 usage_cap 與 count（需帶入 id, usageCap 與 count）",
        "operationId": "updateDiscount",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DiscountReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/discount/update-count": {
      "post": {
        "tags": [
          "折抵管理模組"
        ],
        "summary": "修改累積次數",
        "description": "修改指定 discount 的 count（需帶入 id 與新的 count）",
        "operationId": "updateCount",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DiscountReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/discount/create": {
      "post": {
        "tags": [
          "折抵管理模組"
        ],
        "summary": "新增折抵記錄",
        "description": "新增一筆 discount（需帶入 regionsId、usageCap，count 選填預設 0）",
        "operationId": "create_2",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/DiscountReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/cart/sync": {
      "post": {
        "tags": [
          "購物車管理模組"
        ],
        "summary": "同步購物車商品",
        "description": "新增商品至購物車或更新現有商品數量",
        "operationId": "syncItem",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CartSyncReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/CartViewRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/cart/switch-branch": {
      "post": {
        "tags": [
          "購物車管理模組"
        ],
        "summary": "切換分店",
        "description": "切換分店後將產生新的購物車，原購物車內容將被清空或重置",
        "operationId": "switchBranch",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CartSwitchBranchReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/CartViewRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/cart/gift": {
      "post": {
        "tags": [
          "購物車管理模組"
        ],
        "summary": "選擇贈品",
        "description": "使用者在購物車中選擇符合條件的贈品",
        "operationId": "selectGift",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CartSelectGiftReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/CartViewRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/ai/promo-copy": {
      "post": {
        "tags": [
          "AI 智能輔助模組"
        ],
        "summary": "生成活動宣傳文案",
        "description": "上傳活動圖片並輸入活動名稱，自動生成社群媒體用的宣傳文案",
        "operationId": "generatePromoCopy",
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "$ref": "#/components/schemas/AiPromotionsReq"
                  },
                  "file": {
                    "type": "string",
                    "format": "binary",
                    "description": "活動宣傳圖片"
                  }
                },
                "required": [
                  "data",
                  "file"
                ]
              },
              "encoding": {
                "data": {
                  "contentType": "application/json"
                }
              }
            }
          }
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AiRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/ai/product-desc": {
      "post": {
        "tags": [
          "AI 智能輔助模組"
        ],
        "summary": "生成商品描述",
        "description": "根據商品名稱、圖片、風格、分類，自動生成適用於菜單的簡短誘人描述",
        "operationId": "generateProductDesc",
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "$ref": "#/components/schemas/AiProductDescReq"
                  },
                  "file": {
                    "type": "string",
                    "format": "binary",
                    "description": "商品圖片"
                  }
                },
                "required": [
                  "data",
                  "file"
                ]
              },
              "encoding": {
                "data": {
                  "contentType": "application/json"
                }
              }
            }
          }
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AiRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/staff/password": {
      "patch": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "員工自行修改密碼",
        "description": "員工驗證舊密碼後變更為新密碼",
        "operationId": "selfChangePassword",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateStaffPasswordReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/admin/staff/{id}/transfer": {
      "patch": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "老闆交換職員分店",
        "description": "老闆可將 RM, MA, ST 調動至任何分店。必須傳入目標分店 ID (newAreaId)",
        "operationId": "changeBranch",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          },
          {
            "name": "newAreaId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/admin/staff/{id}/toggle": {
      "patch": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "調整員工身分",
        "description": "將員工權限晉升或降級",
        "operationId": "toggle_1",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/admin/staff/{id}/status": {
      "patch": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "調整員工狀態",
        "description": "停權或復權指定員工",
        "operationId": "updateStatus",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateStaffStatusReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/admin/staff/{id}/password": {
      "patch": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "管理員修改員工密碼",
        "description": "由管理員強制重置員工密碼",
        "operationId": "changePassword",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/admin/staff/{id}/change-role": {
      "patch": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "老闆交換角色",
        "description": "老闆可任意升降 ST, MA, RM。必須傳入目標角色 (例如: MANAGER_AGENT)",
        "operationId": "adminChangeRole",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          },
          {
            "name": "targetRole",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/StaffSearchRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/status/{id}": {
      "patch": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "更新商品狀態",
        "description": "部分更新商品的啟用/停用狀態",
        "operationId": "updateActiveStatus",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "商品 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 1
          },
          {
            "name": "active",
            "in": "query",
            "description": "是否啟用",
            "required": true,
            "schema": {
              "type": "boolean"
            },
            "example": true
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminProductRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/inventory/active-status": {
      "patch": {
        "tags": [
          "分店庫存管理模組"
        ],
        "summary": "快速切換分店商品上下架狀態",
        "description": "供分店管理人員快速開啟或關閉特定商品在該分店的販售狀態",
        "operationId": "updateBranchActiveStatus",
        "parameters": [
          {
            "name": "productId",
            "in": "query",
            "description": "商品 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 101
          },
          {
            "name": "globalAreaId",
            "in": "query",
            "description": "分店 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 5
          },
          {
            "name": "active",
            "in": "query",
            "description": "上架狀態",
            "required": true,
            "schema": {
              "type": "boolean"
            },
            "example": true
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BranchInventoryRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/staff/auth/logout": {
      "get": {
        "tags": [
          "員工管理模組"
        ],
        "summary": "員工登出",
        "description": "銷毀當前 Session",
        "operationId": "logout",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/regions/get_all": {
      "get": {
        "tags": [
          "區域稅務管理模組"
        ],
        "summary": "取得各國基本設定清單",
        "description": "查詢系統內所有國家的稅率與配置清單",
        "operationId": "getAll",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/RegionsRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/list": {
      "get": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "取得活動列表",
        "description": "取得所有促銷活動及其贈品規則 (管理後台用)",
        "operationId": "list",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/PromotionsListRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/image/{id}": {
      "get": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "取得活動圖片",
        "description": "獲取指定活動的圖片檔案",
        "operationId": "getImage",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string",
                  "format": "byte"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/trash": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "取得下架商品",
        "description": "查詢已刪除/下架的商品列表",
        "operationId": "getDeletedProducts",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminProductRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/styles": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "取得風格",
        "description": "取得全部的商品風格",
        "operationId": "getAllStyles",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Style"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/rm/monthlysales": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "分店長銷售報表",
        "description": "查詢該分店在指定年月的商品銷售總量 (分店ID取自登入狀態)",
        "operationId": "getMonthlySalesByBranch",
        "parameters": [
          {
            "name": "year",
            "in": "query",
            "description": "年份",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 2026
          },
          {
            "name": "month",
            "in": "query",
            "description": "月份",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 4
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MonthlyProductsSalesRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/list": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "取得所有上架商品",
        "description": "查詢目前處於上架狀態的商品列表",
        "operationId": "getActiveProducts",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminProductRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/image/{id}": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "獲取商品圖片",
        "description": "根據 ID 讀取圖片二進位流",
        "operationId": "getProductImage",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string",
                  "format": "byte"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/detail/{id}": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "查詢商品詳情",
        "description": "根據商品 ID 取得單一商品詳細資料",
        "operationId": "getProductDetail",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "商品 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 1
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/AdminProductRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/categories": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "取得餐點分類",
        "description": "取得全部的餐點分類",
        "operationId": "getAllCategories",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Category"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/product/admin/top5monthlysales": {
      "get": {
        "tags": [
          "商品管理模組"
        ],
        "summary": "老闆查詢銷售前五名",
        "description": "查詢指定國家在指定年月的銷售前五名商品",
        "operationId": "getTop5MonthlySalesByRegion",
        "parameters": [
          {
            "name": "year",
            "in": "query",
            "description": "年份",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 2026
          },
          {
            "name": "month",
            "in": "query",
            "description": "月份",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 4
          },
          {
            "name": "regionId",
            "in": "query",
            "description": "區域 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 1
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MonthlyProductsSalesRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/linepay/confirm": {
      "get": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "LinePay 付款確認",
        "description": "接收 LinePay 支付完成後的確認導回",
        "operationId": "linePayConfirm",
        "parameters": [
          {
            "name": "transactionId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "orderDateId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/goPay": {
      "get": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "前往付款頁面",
        "description": "根據選擇的付款方式 (ECPAY/LINEPAY) 轉導至金流平台",
        "operationId": "goPay",
        "parameters": [
          {
            "name": "arg0",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "way",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/get_today_all_orders_list": {
      "get": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "取的該分店今天所有訂單",
        "description": "查詢今天所有訂單記錄",
        "operationId": "getTodayAllOrdersListByBranch",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GetAllOrdersRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/get_order_by_phone": {
      "get": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "手機號碼取餐",
        "description": "根據電話號碼查詢今日待取餐訂單",
        "operationId": "getOrderByPhone",
        "parameters": [
          {
            "name": "phone",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GetAllOrdersRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/get_all_today_orders_list": {
      "get": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "取的該會員的今天所有訂單",
        "description": "查詢該會員的所有歷史訂單記錄",
        "operationId": "getTodayOrdersListByMember",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GetAllOrdersUncompleteRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/orders/get_all_orders_list": {
      "get": {
        "tags": [
          "訂單管理模組"
        ],
        "summary": "取得會員歷史訂單",
        "description": "查詢該會員的所有歷史訂單記錄",
        "operationId": "getAllOrdersListByMember",
        "parameters": [
          {
            "name": "memberId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GetAllOrdersRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/members/logout": {
      "get": {
        "tags": [
          "會員管理模組"
        ],
        "summary": "會員登出",
        "description": "銷毀當前 Session",
        "operationId": "logout_1",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MembersRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/members/get_members_count/{phone}": {
      "get": {
        "tags": [
          "會員管理模組"
        ],
        "summary": "查詢消費統計",
        "description": "根據手機號碼獲取會員 ID、手機號及累計消費次數",
        "operationId": "getMemberOrderStats",
        "parameters": [
          {
            "name": "phone",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MemberOrderCountRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/inventory/product/{productId}": {
      "get": {
        "tags": [
          "分店庫存管理模組"
        ],
        "summary": "查詢特定商品庫存",
        "description": "查詢某個商品在所有分店的庫存分佈狀況",
        "operationId": "getInventoryByProduct",
        "parameters": [
          {
            "name": "productId",
            "in": "path",
            "description": "商品 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 101
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BranchInventoryRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/inventory/menu/{globalAreaId}": {
      "get": {
        "tags": [
          "分店庫存管理模組"
        ],
        "summary": "取得分店菜單",
        "description": "根據分店 ID 獲取該分店目前販售的菜單列表",
        "operationId": "getMenuByArea",
        "parameters": [
          {
            "name": "globalAreaId",
            "in": "path",
            "description": "分店 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 5
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/MenuListRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/inventory/branch/{globalAreaId}": {
      "get": {
        "tags": [
          "分店庫存管理模組"
        ],
        "summary": "查詢分店所有商品庫存",
        "description": "透過分店 ID 查詢該店內所有商品的當前庫存狀況",
        "operationId": "getInventoryByArea",
        "parameters": [
          {
            "name": "globalAreaId",
            "in": "path",
            "description": "分店 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 5
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BranchInventoryRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/global-area/get_all_branch": {
      "get": {
        "tags": [
          "分店管理模組"
        ],
        "summary": "取得分店清單",
        "description": "獲取目前系統中所有有效的分店列表",
        "operationId": "getAllBranch",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/GlobalAreaRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/exchange-rates/get_all_rates": {
      "get": {
        "tags": [
          "匯率管理模組"
        ],
        "summary": "取得全部匯率",
        "description": "獲取系統中所有匯率的歷史紀錄清單",
        "operationId": "getAllRates",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/ExchangeRatesRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/discount/{id}": {
      "get": {
        "tags": [
          "折抵管理模組"
        ],
        "summary": "查詢單筆折抵記錄",
        "description": "根據 discount 主鍵 id 查詢單筆記錄",
        "operationId": "getById",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "discount 主鍵 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/DiscountRes"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "折抵管理模組"
        ],
        "summary": "刪除折抵記錄",
        "description": "真刪除指定 discount 記錄（不可回復）",
        "operationId": "delete_1",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "discount 主鍵 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/discount/list": {
      "get": {
        "tags": [
          "折抵管理模組"
        ],
        "summary": "查詢全部折抵記錄",
        "description": "取得所有 discount 記錄（含各國折抵上限與累積次數）",
        "operationId": "list_1",
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/DiscountRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/cart/{cartId}": {
      "get": {
        "tags": [
          "購物車管理模組"
        ],
        "summary": "查看購物車",
        "description": "取得當前購物車的完整商品列表與狀態",
        "operationId": "viewCart",
        "parameters": [
          {
            "name": "cartId",
            "in": "path",
            "description": "購物車 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 7
          },
          {
            "name": "memberId",
            "in": "query",
            "description": "會員 ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 3
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/CartViewRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/promotions/deletePromotion/{id}": {
      "delete": {
        "tags": [
          "促銷活動管理模組"
        ],
        "summary": "刪除促銷活動",
        "description": "真刪除指定促銷活動及底下所有關聯贈品",
        "operationId": "deletePromotion",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int32"
            }
          }
        ],
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          }
        }
      }
    },
    "/lazybaobao/cart/clear": {
      "delete": {
        "tags": [
          "購物車管理模組"
        ],
        "summary": "清空購物車",
        "description": "移除購物車內所有商品",
        "operationId": "clearCart",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CartClearReq"
              }
            }
          },
          "required": true
        },
        "responses": {
          "400": {
            "description": "Bad Request",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/BasicRes"
                }
              }
            }
          },
          "200": {
            "description": "OK",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/CartViewRes"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "BasicRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          }
        }
      },
      "LoginStaffReq": {
        "type": "object",
        "properties": {
          "account": {
            "type": "string",
            "minLength": 1
          },
          "password": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "account",
          "password"
        ]
      },
      "Staff": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "name": {
            "type": "string"
          },
          "account": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "role": {
            "type": "string",
            "enum": [
              "ADMIN",
              "REGION_MANAGER",
              "MANAGER_AGENT",
              "STAFF"
            ]
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32"
          },
          "status": {
            "type": "boolean"
          },
          "hireAt": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "StaffSearchRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "staffList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Staff"
            }
          },
          "mustChangePassword": {
            "type": "boolean"
          }
        }
      },
      "RegisterStaffReq": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "role": {
            "type": "string",
            "minLength": 1
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          }
        },
        "required": [
          "name",
          "role"
        ]
      },
      "RevenueQueryReq": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string"
          },
          "endDate": {
            "type": "string"
          },
          "regionsId": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "RevenueDataVo": {
        "type": "object",
        "properties": {
          "branchName": {
            "type": "string"
          },
          "regionsName": {
            "type": "string"
          },
          "totalAmount": {
            "type": "number"
          },
          "totalCost": {
            "type": "number"
          }
        }
      },
      "RevenueQueryRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "revenueData": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RevenueDataVo"
            }
          }
        }
      },
      "MonthRangeReportsReq": {
        "type": "object",
        "properties": {
          "startMonth": {
            "type": "string"
          },
          "endMonth": {
            "type": "string"
          }
        }
      },
      "MonthRangeReportsRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "reportList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MonthlyReportDetailVo"
            }
          }
        }
      },
      "MonthlyReportDetailVo": {
        "type": "object",
        "properties": {
          "reportDate": {
            "type": "string"
          },
          "branchName": {
            "type": "string"
          },
          "regionsName": {
            "type": "string"
          },
          "totalAmount": {
            "type": "number"
          },
          "totalCost": {
            "type": "number"
          }
        }
      },
      "MonthlyReportReq": {
        "type": "object",
        "properties": {
          "reportDate": {
            "type": "string"
          }
        }
      },
      "MonthlyReportRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "currentData": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MonthlyReportDetailVo"
            }
          },
          "lastData": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MonthlyReportDetailVo"
            }
          }
        }
      },
      "UpdateRegionsReq": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "taxRate": {
            "type": "number"
          },
          "taxType": {
            "type": "string"
          }
        }
      },
      "CreateRegionsReq": {
        "type": "object",
        "properties": {
          "country": {
            "type": "string",
            "minLength": 1
          },
          "currencyCode": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[A-Za-z]{3}$"
          },
          "countryCode": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[A-Za-z]{2}$"
          },
          "taxRate": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "taxType": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "country",
          "countryCode",
          "currencyCode",
          "taxRate",
          "taxType"
        ]
      },
      "PromotionsManageReq": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "startTime": {
            "type": "string",
            "format": "date"
          },
          "endTime": {
            "type": "string",
            "format": "date"
          },
          "promotionsId": {
            "type": "integer",
            "format": "int32"
          },
          "fullAmount": {
            "type": "number"
          },
          "quantity": {
            "type": "integer",
            "format": "int32"
          },
          "giftProductId": {
            "type": "integer",
            "format": "int32"
          },
          "active": {
            "type": "boolean"
          }
        }
      },
      "GiftItemVo": {
        "type": "object",
        "properties": {
          "promotionsGiftsId": {
            "type": "integer",
            "format": "int32"
          },
          "productId": {
            "type": "integer",
            "format": "int32"
          },
          "productName": {
            "type": "string"
          },
          "quantity": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "PromotionsReq": {
        "type": "object",
        "properties": {
          "cartId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "memberId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "useCoupon": {
            "type": "boolean"
          },
          "selectedGiftId": {
            "type": "integer",
            "format": "int32"
          },
          "originalAmount": {
            "type": "number"
          },
          "country": {
            "type": "string"
          }
        },
        "required": [
          "originalAmount"
        ]
      },
      "PromotionsRes": {
        "type": "object",
        "properties": {
          "cartId": {
            "type": "integer",
            "format": "int32"
          },
          "appliedPromotionIds": {
            "type": "array",
            "items": {
              "type": "integer",
              "format": "int32"
            }
          },
          "appliedDiscountName": {
            "type": "string"
          },
          "originalAmount": {
            "type": "number"
          },
          "finalAmount": {
            "type": "integer",
            "format": "int32"
          },
          "receivedGifts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/GiftItemVo"
            }
          }
        }
      },
      "ProductUpdateReq": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "category": {
            "type": "string",
            "minLength": 1
          },
          "style": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string",
            "minLength": 1
          },
          "active": {
            "type": "boolean"
          },
          "id": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          }
        },
        "required": [
          "category",
          "description",
          "name",
          "style"
        ]
      },
      "AdminProductRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "product": {
            "$ref": "#/components/schemas/ProductAdminVo"
          },
          "productList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ProductAdminVo"
            }
          },
          "inventoryList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InventoryDetailVo"
            }
          }
        }
      },
      "InventoryDetailVo": {
        "type": "object",
        "properties": {
          "productId": {
            "type": "integer",
            "format": "int32"
          },
          "productName": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "style": {
            "type": "string"
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32"
          },
          "branchName": {
            "type": "string"
          },
          "basePrice": {
            "type": "number"
          },
          "costPrice": {
            "type": "number"
          },
          "stockQuantity": {
            "type": "integer",
            "format": "int32"
          },
          "maxOrderQuantity": {
            "type": "integer",
            "format": "int32"
          },
          "active": {
            "type": "boolean"
          },
          "masterActive": {
            "type": "boolean"
          }
        }
      },
      "ProductAdminVo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "name": {
            "type": "string"
          },
          "categoryId": {
            "type": "integer",
            "format": "int32"
          },
          "category": {
            "type": "string"
          },
          "styleId": {
            "type": "integer",
            "format": "int32"
          },
          "style": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "active": {
            "type": "boolean"
          },
          "foodImgBase64": {
            "type": "string"
          }
        }
      },
      "ProductCreateReq": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "category": {
            "type": "string",
            "minLength": 1
          },
          "style": {
            "type": "string",
            "minLength": 1
          },
          "description": {
            "type": "string",
            "minLength": 1
          },
          "active": {
            "type": "boolean"
          }
        },
        "required": [
          "category",
          "description",
          "name",
          "style"
        ]
      },
      "OrderCartDetails": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "orderCartId": {
            "type": "integer",
            "format": "int32"
          },
          "productId": {
            "type": "integer",
            "format": "int32"
          },
          "quantity": {
            "type": "integer",
            "format": "int32"
          },
          "price": {
            "type": "number"
          },
          "gift": {
            "type": "boolean"
          },
          "discountNote": {
            "type": "string"
          },
          "promotionsGiftsId": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "PayForPOSReq": {
        "type": "object",
        "properties": {
          "orderCartId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "memberId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "phone": {
            "type": "string",
            "maxLength": 16,
            "minLength": 7
          },
          "subtotalBeforeTax": {
            "type": "number"
          },
          "taxAmount": {
            "type": "number"
          },
          "totalAmount": {
            "type": "number"
          },
          "orderCartDetailsList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/OrderCartDetails"
            },
            "minItems": 1
          },
          "useDiscount": {
            "type": "boolean"
          },
          "promotionsId": {
            "type": "integer",
            "format": "int32"
          },
          "paymentMethod": {
            "type": "string",
            "minLength": 1
          },
          "transactionId": {
            "type": "string"
          }
        },
        "required": [
          "orderCartDetailsList",
          "paymentMethod",
          "phone"
        ]
      },
      "PayReq": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "orderDateId": {
            "type": "string",
            "minLength": 1
          },
          "paymentMethod": {
            "type": "string",
            "minLength": 1
          },
          "transactionId": {
            "type": "string"
          },
          "totalAmount": {
            "type": "number"
          }
        },
        "required": [
          "id",
          "orderDateId",
          "paymentMethod",
          "totalAmount"
        ]
      },
      "UpdateOrdersStatusReq": {
        "type": "object",
        "properties": {
          "orderDateId": {
            "type": "string",
            "minLength": 1
          },
          "id": {
            "type": "string",
            "minLength": 1
          },
          "ordersStatus": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "id",
          "orderDateId",
          "ordersStatus"
        ]
      },
      "CreateOrdersReq": {
        "type": "object",
        "properties": {
          "orderCartId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "memberId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "phone": {
            "type": "string",
            "maxLength": 16,
            "minLength": 7
          },
          "subtotalBeforeTax": {
            "type": "number"
          },
          "taxAmount": {
            "type": "number"
          },
          "totalAmount": {
            "type": "number"
          },
          "orderCartDetailsList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/OrderCartDetails"
            },
            "minItems": 1
          },
          "useDiscount": {
            "type": "boolean"
          },
          "promotionsId": {
            "type": "integer",
            "format": "int32"
          }
        },
        "required": [
          "orderCartDetailsList",
          "phone"
        ]
      },
      "CreateOrdersRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "orderDateId": {
            "type": "string"
          },
          "totalAmount": {
            "type": "number"
          }
        }
      },
      "CashPayOnSiteReq": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1
          },
          "orderDateId": {
            "type": "string",
            "minLength": 1
          },
          "totalAmount": {
            "type": "number"
          },
          "paymentMethod": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "orderDateId",
          "totalAmount"
        ]
      },
      "UpdatePasswordReq": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "oldPassword": {
            "type": "string",
            "maxLength": 2147483647,
            "minLength": 6
          },
          "newPassword": {
            "type": "string",
            "maxLength": 2147483647,
            "minLength": 6
          }
        },
        "required": [
          "newPassword",
          "oldPassword"
        ]
      },
      "RegisterMembersReq": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "phone": {
            "type": "string",
            "maxLength": 16,
            "minLength": 7
          },
          "regionsId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "password": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "phone"
        ]
      },
      "LoginMembersReq": {
        "type": "object",
        "properties": {
          "phone": {
            "type": "string",
            "minLength": 1
          },
          "regionsId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "password": {
            "type": "string",
            "maxLength": 2147483647,
            "minLength": 6
          }
        },
        "required": [
          "password",
          "phone"
        ]
      },
      "Members": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "name": {
            "type": "string"
          },
          "regionsId": {
            "type": "integer",
            "format": "int32"
          },
          "phone": {
            "type": "string"
          },
          "password": {
            "type": "string"
          },
          "orderCount": {
            "type": "integer",
            "format": "int32"
          },
          "discount": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "MembersRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "members": {
            "$ref": "#/components/schemas/Members"
          }
        }
      },
      "BranchInventoryUpdateReq": {
        "type": "object",
        "properties": {
          "productId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "stockQuantity": {
            "type": "integer",
            "format": "int32",
            "minimum": 0
          },
          "basePrice": {
            "type": "number",
            "minimum": 0.01
          },
          "costPrice": {
            "type": "number",
            "minimum": 0.01
          },
          "maxOrderQuantity": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "active": {
            "type": "boolean"
          }
        }
      },
      "BranchInventoryRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InventoryDetailVo"
            }
          }
        }
      },
      "UpdateGlobalAreaReq": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "branch": {
            "type": "string"
          },
          "address": {
            "type": "string"
          },
          "phone": {
            "type": "string",
            "maxLength": 16,
            "minLength": 0
          }
        }
      },
      "DeleteGlobalAreaReq": {
        "type": "object",
        "properties": {
          "globalAreaIdList": {
            "type": "array",
            "items": {
              "type": "integer",
              "format": "int32"
            },
            "minItems": 1
          }
        },
        "required": [
          "globalAreaIdList"
        ]
      },
      "CreateGlobalAreaReq": {
        "type": "object",
        "properties": {
          "regionsId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "branch": {
            "type": "string",
            "minLength": 1
          },
          "address": {
            "type": "string",
            "minLength": 1
          },
          "phone": {
            "type": "string",
            "maxLength": 16,
            "minLength": 7
          }
        },
        "required": [
          "address",
          "branch",
          "phone"
        ]
      },
      "ExchangeRatesReq": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "format": "date"
          }
        },
        "required": [
          "date"
        ]
      },
      "ExchangeRates": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "currencyCode": {
            "type": "string"
          },
          "rateToTwd": {
            "type": "number"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ExchangeRatesRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "exchangeRatesList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ExchangeRates"
            }
          }
        }
      },
      "DiscountReq": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "regionsId": {
            "type": "integer",
            "format": "int32"
          },
          "count": {
            "type": "integer",
            "format": "int32"
          },
          "usageCap": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "CartSyncReq": {
        "type": "object",
        "properties": {
          "cartId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "operationType": {
            "type": "string"
          },
          "staffId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "memberId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "productId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "quantity": {
            "type": "integer",
            "format": "int32",
            "minimum": 0
          }
        }
      },
      "AvailableGiftVo": {
        "type": "object",
        "properties": {
          "giftRuleId": {
            "type": "integer",
            "format": "int32"
          },
          "giftProductId": {
            "type": "integer",
            "format": "int32"
          },
          "giftProductName": {
            "type": "string"
          },
          "fullAmount": {
            "type": "number"
          },
          "available": {
            "type": "boolean"
          },
          "unavailableReason": {
            "type": "string"
          }
        }
      },
      "AvailablePromotionVo": {
        "type": "object",
        "properties": {
          "promotionId": {
            "type": "integer",
            "format": "int32"
          },
          "promotionName": {
            "type": "string"
          },
          "fullAmount": {
            "type": "number"
          },
          "gifts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AvailableGiftVo"
            }
          }
        }
      },
      "CartItemVo": {
        "type": "object",
        "properties": {
          "detailId": {
            "type": "integer",
            "format": "int32"
          },
          "productId": {
            "type": "integer",
            "format": "int32"
          },
          "productName": {
            "type": "string"
          },
          "quantity": {
            "type": "integer",
            "format": "int32"
          },
          "price": {
            "type": "number"
          },
          "discountNote": {
            "type": "string"
          },
          "lineTotal": {
            "type": "number"
          },
          "gift": {
            "type": "boolean"
          }
        }
      },
      "CartViewRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "cartId": {
            "type": "integer",
            "format": "int32"
          },
          "operationType": {
            "type": "string"
          },
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CartItemVo"
            }
          },
          "subtotal": {
            "type": "number"
          },
          "availablePromotions": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AvailablePromotionVo"
            }
          },
          "taxInfo": {
            "$ref": "#/components/schemas/TaxInfoVo"
          },
          "totalAmount": {
            "type": "number"
          },
          "warningMessages": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "TaxInfoVo": {
        "type": "object",
        "properties": {
          "taxRate": {
            "type": "number"
          },
          "taxType": {
            "type": "string"
          },
          "taxAmount": {
            "type": "number"
          }
        }
      },
      "CartSwitchBranchReq": {
        "type": "object",
        "properties": {
          "oldCartId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "newGlobalAreaId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "memberId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          }
        }
      },
      "CartSelectGiftReq": {
        "type": "object",
        "properties": {
          "cartId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "memberId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "giftRuleId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          }
        }
      },
      "AiPromotionsReq": {
        "type": "object",
        "properties": {
          "promotionsId": {
            "type": "integer",
            "format": "int32"
          },
          "activityName": {
            "type": "string"
          },
          "promotionItems": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PromotionItem"
            }
          }
        }
      },
      "PromotionItem": {
        "type": "object",
        "properties": {
          "productId": {
            "type": "integer",
            "format": "int32"
          },
          "fullAmount": {
            "type": "number"
          }
        }
      },
      "AiRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "generatedDescription": {
            "type": "string"
          }
        }
      },
      "AiProductDescReq": {
        "type": "object",
        "properties": {
          "productid": {
            "type": "integer",
            "format": "int32"
          },
          "productName": {
            "type": "string",
            "minLength": 1
          },
          "category": {
            "type": "string",
            "minLength": 1
          },
          "style": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "category",
          "productName",
          "style"
        ]
      },
      "UpdateStaffPasswordReq": {
        "type": "object",
        "properties": {
          "account": {
            "type": "string"
          },
          "oldPassword": {
            "type": "string",
            "minLength": 1
          },
          "newPassword": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "newPassword",
          "oldPassword"
        ]
      },
      "UpdateStaffStatusReq": {
        "type": "object",
        "properties": {
          "newStatus": {
            "type": "boolean"
          }
        }
      },
      "Regions": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "country": {
            "type": "string"
          },
          "currencyCode": {
            "type": "string"
          },
          "countryCode": {
            "type": "string"
          },
          "taxRate": {
            "type": "number"
          },
          "taxType": {
            "type": "string",
            "enum": [
              "INCLUSIVE",
              "EXCLUSIVE"
            ]
          },
          "createdAt": {
            "type": "string",
            "format": "date"
          },
          "updatedAt": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "RegionsRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "regionsList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Regions"
            }
          }
        }
      },
      "GiftDetailVo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "fullAmount": {
            "type": "number"
          },
          "quantity": {
            "type": "integer",
            "format": "int32"
          },
          "giftProductId": {
            "type": "integer",
            "format": "int32"
          },
          "productName": {
            "type": "string"
          },
          "active": {
            "type": "boolean"
          }
        }
      },
      "PromotionDetailVo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "name": {
            "type": "string"
          },
          "startTime": {
            "type": "string",
            "format": "date"
          },
          "endTime": {
            "type": "string",
            "format": "date"
          },
          "active": {
            "type": "boolean"
          },
          "gifts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/GiftDetailVo"
            }
          },
          "description": {
            "type": "string"
          },
          "promotionImg": {
            "type": "string"
          }
        }
      },
      "PromotionsListRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PromotionDetailVo"
            }
          }
        }
      },
      "Style": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "name": {
            "type": "string"
          }
        }
      },
      "MonthlyProductsSalesRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "salesList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MonthlyProductsSalesVo"
            }
          }
        }
      },
      "MonthlyProductsSalesVo": {
        "type": "object",
        "properties": {
          "productName": {
            "type": "string"
          },
          "totalQuantity": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "Category": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "name": {
            "type": "string"
          }
        }
      },
      "GetAllOrdersRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "getOrderVoList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/GetOrdersVo"
            }
          }
        }
      },
      "GetOrdersDetailVo": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "quantity": {
            "type": "integer",
            "format": "int32"
          },
          "price": {
            "type": "number"
          },
          "gift": {
            "type": "boolean"
          },
          "discountNote": {
            "type": "string"
          }
        }
      },
      "GetOrdersVo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "orderDateId": {
            "type": "string"
          },
          "globalAreaId": {
            "type": "integer",
            "format": "int32"
          },
          "totalAmount": {
            "type": "number"
          },
          "ordersStatus": {
            "type": "string"
          },
          "payStatus": {
            "type": "string"
          },
          "completedAt": {
            "type": "string",
            "format": "date-time"
          },
          "getOrdersDetailVoList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/GetOrdersDetailVo"
            }
          }
        }
      },
      "GetAllOrdersUncompleteRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "ordersList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/OrderInfo"
            }
          }
        }
      },
      "OrderInfo": {
        "type": "object",
        "properties": {
          "orderDateId": {
            "type": "string"
          },
          "id": {
            "type": "string"
          },
          "orderStatus": {
            "type": "string"
          }
        }
      },
      "MemberData": {
        "type": "object",
        "properties": {
          "memberId": {
            "type": "integer",
            "format": "int32"
          },
          "phone": {
            "type": "string"
          },
          "orderCount": {
            "type": "integer",
            "format": "int32"
          },
          "regionsId": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "MemberOrderCountRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "$ref": "#/components/schemas/MemberData"
          }
        }
      },
      "MenuListRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/MenuVo"
            }
          }
        }
      },
      "MenuVo": {
        "type": "object",
        "properties": {
          "productId": {
            "type": "integer",
            "format": "int32"
          },
          "name": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "style": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "foodImgBase64": {
            "type": "string"
          },
          "basePrice": {
            "type": "number"
          },
          "stockQuantity": {
            "type": "integer",
            "format": "int32"
          },
          "active": {
            "type": "boolean"
          }
        }
      },
      "GlobalArea": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "regionsId": {
            "type": "integer",
            "format": "int32"
          },
          "branch": {
            "type": "string"
          },
          "address": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          }
        }
      },
      "GlobalAreaRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "globalAreaList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/GlobalArea"
            }
          }
        }
      },
      "Discount": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32"
          },
          "regionsId": {
            "type": "integer",
            "format": "int32"
          },
          "count": {
            "type": "integer",
            "format": "int32"
          },
          "usageCap": {
            "type": "integer",
            "format": "int32"
          }
        }
      },
      "DiscountRes": {
        "type": "object",
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          },
          "discountList": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Discount"
            }
          }
        }
      },
      "CartClearReq": {
        "type": "object",
        "properties": {
          "cartId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          },
          "memberId": {
            "type": "integer",
            "format": "int32",
            "minimum": 1
          }
        }
      }
    }
  }
}