export default {
  title: '🪄X1Sy23',
  base: '/Blog/',
  themeConfig: {
    logo: '/cat.png',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/huangkuaikuai' }
    ],

    nav: [
      { text: '笔记', link: '/notes/index'},
      {
        text: '生活', link: '/life/index'
      },
    ],

    sidebar: {
      '/notes': [
        {
          text: '📒 JavaScript',
          items: [
            {
              text: '别再使用Date.now()计算时间差', link: '/notes/javascript/date.md'
            }
          ]
        },
        {
          text: '🎸 电吉他',
          items: [
            {
              text: '调音思路', link: '/notes/guitar/tone.md'
            }
          ]
        }
      ],
      '/life': [
        // {
        //   text: '吉他练习日记',
        //   items: [
        //     {
        //       text: '黒い涙（NANA）', link: '/life/guitar/guitarPractice-1.md'
        //     }
        //   ]
        // },
        {
          text: '🐟 咸鱼日记',
          items: [
            {
              text: '🏰 霍格沃茨之遗', link: '/life/game/game-1.md'
            }
          ]
        },
      ]
      
    },

    footer: {
      // message: '',
      copyright: 'shuyang@2023',
    },

    docFooter: { prev: '上一篇', next: '下一篇' }
  },
  
}