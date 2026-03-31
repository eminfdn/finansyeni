export const investmentQuotes: string[] = [
  "Paranızı çalıştırın, siz değil. – Warren Buffett",
  "Yatırım yapmamak en büyük risktir. – Seth Klarman",
  "Sabır, yatırımın en güçlü silahıdır.",
  "Bugün ektiğin tohum, yarının hasadıdır.",
  "Risk almaktan korkma, hiç başlamamaktan kork.",
  "En iyi yatırım zamanı dündü, ikinci en iyi zaman bugün.",
  "Portföyünü çeşitlendir, geleceğini güvence altına al.",
  "Bilgi güçtür, finansal okuryazarlık özgürlüktür.",
  "Küçük adımlar büyük servetler yaratır.",
  "Paranın değerini korumak, kazanmak kadar önemlidir.",
  "Uzun vadeli düşün, kısa vadeli panik yapma.",
  "Her düşüş yeni bir fırsattır. – Peter Lynch",
  "Bileşik faiz, dünyanın sekizinci harikasıdır. – Einstein",
  "Zenginlik bir gecede değil, tutarlılıkla inşa edilir.",
  "Piyasayı zamanlamaya çalışma, piyasada zaman geçir.",
  "Duygularınla değil, verilere dayalı yatırım yap.",
  "Her başarılı yatırımcı bir zamanlar acemiydi.",
  "Hedef olmadan yatırım, pusulasız yolculuk gibidir.",
  "Disiplinli yatırımcı her zaman kazanır.",
  "Bugünkü fedakarlık, yarının özgürlüğüdür.",
];

export function getDailyQuote(): string {
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % investmentQuotes.length;
  return investmentQuotes[dayIndex];
}
