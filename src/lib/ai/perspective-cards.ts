import type { PerspectiveCard } from '@/types/database';

export const PERSPECTIVE_CARDS: PerspectiveCard[] = [
  { id: 'pc_1', key: 'reverse', label: '真逆にする', description: '全ての前提を逆転させてみる' },
  { id: 'pc_2', key: 'kids', label: '子ども向けにする', description: '小学生でも使えるようにシンプルに' },
  { id: 'pc_3', key: 'luxury', label: '富裕層向けにする', description: '最高級・プレミアムな体験に変換' },
  { id: 'pc_4', key: 'add_constraint', label: '制約を足す', description: 'あえて制限を加えて創造性を引き出す' },
  { id: 'pc_5', key: 'cross_industry', label: '異業種から借りる', description: '全く違う業界の成功パターンを適用' },
  { id: 'pc_6', key: 'worldview', label: '世界観を乗せる', description: 'ストーリーやブランドの世界観を付与' },
  { id: 'pc_7', key: 'three_seconds', label: '3秒で伝える', description: '一瞬で価値が伝わる形に圧縮' },
  { id: 'pc_8', key: 'subscription', label: 'サブスク化する', description: '継続利用モデルに変換' },
  { id: 'pc_9', key: 'fanatic', label: '熱狂ファン向けにする', description: 'コアファンが熱狂する要素を追加' },
  { id: 'pc_10', key: 'beginner', label: '初心者向けにする', description: '誰でも始められるハードルの低さに' },
  { id: 'pc_11', key: 'automate', label: '全自動にする', description: 'ユーザーの手間をゼロにできないか' },
  { id: 'pc_12', key: 'social', label: 'ソーシャル化する', description: '友達と使える・共有したくなる設計に' },
  { id: 'pc_13', key: 'gamify', label: 'ゲーム化する', description: 'ゲームの仕組みを取り入れる' },
  { id: 'pc_14', key: 'offline', label: 'オフラインで考える', description: 'リアルな場での体験に変換' },
  { id: 'pc_15', key: 'data_driven', label: 'データで語る', description: '数字やエビデンスベースにする' },
];

export const RESCUE_ACTIONS = [
  { key: 'stuck', label: '詰まった', emoji: '😵', description: '全く新しい切り口を提案します' },
  { key: 'weird', label: '変な案ほしい', emoji: '🤪', description: '常識はずれな案を出します' },
  { key: 'too_serious', label: '真面目すぎる', emoji: '😤', description: '遊び心のある方向へ' },
  { key: 'more_sellable', label: 'もっと売れる方向', emoji: '💸', description: '収益に直結する案を' },
  { key: 'broaden', label: '雑に広げる', emoji: '🌀', description: 'とにかく幅を広げます' },
  { key: 'steal_from_others', label: '他業界から盗む', emoji: '🕵️', description: '異業種の成功パターンを転用' },
  { key: 'reverse', label: '真逆から見る', emoji: '🔄', description: '全ての前提をひっくり返す' },
];
