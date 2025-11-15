# Circulating & Vesting Graph Requirements

## 📊 GRAPH SPECIFICATIONS

### Graph Title
**"JY Token: Circulating Supply & Vesting Timeline"**

Subtitle: *"Only 4M tokens will ever circulate from 6M total supply"*

---

## 📈 DATA TO VISUALIZE

### Total Supply Breakdown (6,000,000 JY)

#### Immediately Circulating at TGE (~1.5M = 25%)
- **Liquidity (Locked):** 300,000 JY (5%) - Permanently locked
- **Initial Public Sale Unlock:** ~0 (9-month cliff first)
- **Seed Initial:** ~0 (9-month cliff first)

#### Gradually Vesting (Timeline-Based)

**Month 0-9:**
- Public Sale: CLIFF (no unlocks)
- Seed: CLIFF (no unlocks)
- Team: CLIFF (no unlocks)
- Ecosystem: Beginning linear vest
- Treasury: Small runway unlocks start Month 6

**Month 9-24 (Critical Period):**
- **Public Sale:** Begins 24-month linear (1,700,000 ÷ 24 = ~70,833/month)
- **Seed:** Begins 12-month linear (300,000 ÷ 12 = 25,000/month)
- **Ecosystem:** Continuing 48-month linear (440,000 over 48 months after sinkhole)
- **Treasury:** Monthly runway + quarterly unlocks

**Month 24-48:**
- **Team:** Begins 4-year linear after 24-month cliff (700,000 ÷ 48 = ~14,583/month)
- **Public Sale:** Fully vested by Month 33
- **Seed:** Fully vested by Month 21
- **Ecosystem:** Continuing vest

**Month 48+:**
- **Treasury Sinkhole:** Unlocks begin Year 2 (1M tokens over 10 years = 27,500/quarter)
- **Ecosystem Sinkhole:** Unlocks begin Year 2 (660,000 over 10 years)

---

## 📉 GRAPH ELEMENTS

### Y-Axis (Left): Circulating Supply
- Range: 0 to 6,000,000 JY
- Mark key levels:
  - 1.5M (25% - TGE)
  - 2M (33%)
  - 3M (50%)
  - 4M (67% - **MAX CIRCULATING**)
  - 6M (100% - never reached)

### X-Axis: Time (Months)
- Range: 0 to 60 months (5 years)
- Mark key milestones:
  - Month 0: TGE
  - Month 6: Treasury runway starts
  - Month 9: Public Sale vest begins
  - Month 24: Team vest begins
  - Month 33: Public Sale fully vested
  - Month 48: Ecosystem 4-year complete

### Key Line/Area Chart Components

#### Area 1 (Dark Blue): Locked Forever
- 300,000 JY Liquidity
- Never unlocks
- Bottom baseline of chart

#### Area 2 (Green): Public Sale Vesting
- Flat at 0 until Month 9
- Linear increase from Month 9 to Month 33
- Total: 1,700,000 JY

#### Area 3 (Orange): Ecosystem Vesting
- Gradual linear from Month 0
- 440,000 over 48 months
- 660,000 in 10-year sinkhole (starts Year 2)

#### Area 4 (Purple): Treasury
- Small unlocks Month 6+
- 400,000 runway over 24 months
- 1,000,000 in sinkhole (starts Year 2)

#### Area 5 (Yellow): Team
- Flat at 0 until Month 24
- Linear increase Month 24-72
- Total: 700,000 JY

#### Area 6 (Cyan): Seed
- Flat at 0 until Month 9
- Linear increase Month 9-21
- Total: 300,000 JY

#### Area 7 (Red): Legal
- Unlocks Month 6+ (100K monthly)
- Quarterly unlocks Month 12+ (400K over 8 quarters)
- Total: 500,000 JY

#### MAX CIRCULATION LINE (Red Dashed)
- Horizontal line at 4,000,000 JY
- Label: "Maximum Ever Circulating: 4M JY"
- Indicates circulating supply never exceeds this

---

## 🎨 DESIGN SPECIFICATIONS

### Color Scheme
- **Background:** Black (#000000)
- **Grid Lines:** Dark Gray (#1a1a1a)
- **Text:** White (#ffffff) or Light Gray (#cccccc)
- **Max Circulation Line:** Red (#ef4444) - dashed
- **Locked Liquidity:** Dark Blue (#1e40af)
- **Public Sale:** Green (#10b981)
- **Ecosystem:** Orange (#f97316)
- **Treasury:** Purple (#d946ef)
- **Team:** Yellow (#fbbf24)
- **Seed:** Cyan (#06b6d4)
- **Legal:** Red (#ef4444)

### Annotations
1. **TGE (Month 0):**
   - "TGE: Only 1.5M circulating (25%)"
   
2. **Month 9:**
   - "Public Sale & Seed vesting begins"
   
3. **Month 24:**
   - "Team vesting begins (24-month cliff)"
   
4. **Month 33:**
   - "Public Sale fully vested"
   
5. **Year 2 (Month 24):**
   - "Sinkhole unlocks begin (10-year schedule)"

6. **4M Line:**
   - "MAX CIRCULATING: Only 4M will EVER be liquid"

---

## 📋 DATA TABLE (For Reference)

### Circulating Supply by Month

| Month | Liquidity | Public | Seed | Ecosystem | Treasury | Team | Legal | **TOTAL** |
|-------|-----------|--------|------|-----------|----------|------|-------|-----------|
| 0 | 300K | 0 | 0 | 0 | 0 | 0 | 0 | **300K** |
| 6 | 300K | 0 | 0 | ~55K | ~27K | 0 | 0 | **~382K** |
| 9 | 300K | ~0 | ~0 | ~82K | ~50K | 0 | ~17K | **~449K** |
| 12 | 300K | ~212K | ~75K | ~110K | ~83K | 0 | ~50K | **~830K** |
| 18 | 300K | ~637K | ~225K | ~165K | ~133K | 0 | ~125K | **~1.59M** |
| 24 | 300K | ~1.06M | 300K | ~220K | ~183K | ~0 | ~200K | **~2.26M** |
| 33 | 300K | 1.7M | 300K | ~285K | ~283K | ~131K | ~300K | **~3.3M** |
| 48 | 300K | 1.7M | 300K | 440K | ~400K | ~350K | ~500K | **~3.99M** |
| 60+ | 300K | 1.7M | 300K | ~660K | ~1.1M | 700K | 500K | **~5.26M** |

*Note: Sinkhole tokens (1.66M) unlock over 10 years from Year 2, keeping circulating supply growth slow*

---

## 🎯 KEY INSIGHTS TO HIGHLIGHT

### Callout Box 1: "Extreme Scarcity"
- Only 25% circulating at TGE
- Takes 4+ YEARS to reach 4M circulating
- 2M tokens locked in 10-year sinkholes

### Callout Box 2: "No Team Dumps"
- 24-month cliff before any team tokens vest
- 85% of team allocation staked at launch
- 4-year linear vesting after cliff

### Callout Box 3: "Permanent Liquidity"
- 300K JY + $270K USDC locked forever
- Protects against rug pulls
- On-chain verified

### Callout Box 4: "Community First"
- 28.3% to public sale (largest allocation)
- Team only 11.7% (with 2-year wait)
- No VC dumps

---

## 🛠️ TOOLS TO CREATE GRAPH

### Option 1: Canva (Recommended)
1. Use "Line Chart" or "Area Chart" template
2. Upload custom data CSV
3. Apply dark theme
4. Add annotations manually
5. Export as PNG (high-res)

### Option 2: Excel/Google Sheets
1. Create stacked area chart
2. Format with dark background
3. Add data labels
4. Export as image

### Option 3: Python (matplotlib)
```python
import matplotlib.pyplot as plt
import numpy as np

months = np.arange(0, 61, 1)
# Add vesting curves for each category
# Plot as stacked area chart
# Add max circulation line at 4M
# Export as PNG
```

### Option 4: Figma/Adobe Illustrator
- Full control over design
- Professional output
- Time-intensive

---

## ✅ CHECKLIST BEFORE EXPORT

- [ ] All 7 vesting categories represented
- [ ] 4M max circulation line clearly marked
- [ ] Cliff periods visible (flat lines)
- [ ] TGE starts at 1.5M circulating
- [ ] Annotations for key milestones
- [ ] Legend explains all colors
- [ ] Title and subtitle clear
- [ ] Dark theme for brand consistency
- [ ] High resolution (min 1920x1080)
- [ ] Export as PNG and SVG

---

## 📁 FILE NAMING

**Suggested filenames:**
- `coindaily-vesting-schedule.png`
- `jy-token-circulating-supply-graph.png`
- `tokenomics-vesting-timeline.png`

**Location:**
- Save to: `MVP/cireulating and vesting graph.png` (replace existing)
- Also save to: `token-landing/public/images/`

---

## 🎨 BRAND CONSISTENCY

Match the website's color scheme:
- Primary: #f97316 (Orange)
- Accent: #d946ef (Purple/Pink)
- Background: Black
- Text: White/Gray

---

**This graph will be THE visual proof of your extreme scarcity claim. Make it count!** 📊🚀
