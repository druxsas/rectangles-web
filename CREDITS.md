# Credits

Third-party assets used in the Rectangle's web project.

## 3D models (Poly Haven, CC0)

All models under `app/public/models/` are from [Poly Haven](https://polyhaven.com) and are released under **CC0 1.0 Universal (Public Domain)**. No attribution is required; credit given here as a courtesy.

| Slug | Used as | Source |
|------|---------|--------|
| `CashRegister_01` | Cash register on the counter | https://polyhaven.com/a/CashRegister_01 |
| `Television_01` | Retro CRT TV in the Games zone | https://polyhaven.com/a/Television_01 |
| `boombox` | Boombox on the music cabinet | https://polyhaven.com/a/boombox |
| `cassette_player` | Cassette player on the music cabinet | https://polyhaven.com/a/cassette_player |
| `Shelf_01` | Shelving behind the counter | https://polyhaven.com/a/Shelf_01 |
| `vintage_cabinet_01` | Reserved for next pass | https://polyhaven.com/a/vintage_cabinet_01 |

To refresh or add more Poly Haven models:

```bash
cd app
node scripts/fetch-polyhaven.mjs <slug> [1k|2k|4k]
```

## Fonts

- **Barlow Condensed** — Google Fonts, SIL Open Font License
- **Inter** — Google Fonts, SIL Open Font License
- **JetBrains Mono** — Google Fonts, SIL Open Font License

## Still to source (or build in Blender)

- iMac G3 (currently a RoundedBox placeholder)
- Arcade cabinet (currently primitive boxes)
- Technics SL-1200 MKII turntable (currently a cylinder + base)
- Skateboard decks (currently boxes on the wall)
- Storefront double doors
- Vendor character
