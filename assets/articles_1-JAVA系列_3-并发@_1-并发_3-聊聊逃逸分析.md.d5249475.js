import{_ as e,c as t,E as s,B as r,z as a,a as c,O as i,G as n,o as y}from"./chunks/framework.acfd9498.js";const _=JSON.parse('{"title":"聊聊逃逸分析","description":"","frontmatter":{},"headers":[],"relativePath":"articles/1-JAVA系列/3-并发@/1-并发/3-聊聊逃逸分析.md","lastUpdated":1683166839000}'),C={name:"articles/1-JAVA系列/3-并发@/1-并发/3-聊聊逃逸分析.md"},D=a("h1",{id:"聊聊逃逸分析",tabindex:"-1"},[c("聊聊逃逸分析 "),a("a",{class:"header-anchor",href:"#聊聊逃逸分析","aria-label":'Permalink to "聊聊逃逸分析"'},"​")],-1),A=i(`<h2 id="什么是逃逸技术" tabindex="-1">什么是逃逸技术 <a class="header-anchor" href="#什么是逃逸技术" aria-label="Permalink to &quot;什么是逃逸技术&quot;">​</a></h2><p>逃逸分析技术是<code>JVM</code>用于提高性能以及节省内存的手段，在<code>JVM</code>编译语境下<code>(JIT阶段)</code>，逃逸分析通过以下两个条件判断该对象是否是逃逸的:</p><ol><li>该对象是否分配在堆上(<code>static</code>关键字或者成员变量)</li><li>该对象是否会传给未知代码，比如<code>return</code>到外部给别的类使用。</li></ol><h2 id="逃逸技术的两个示例" tabindex="-1">逃逸技术的两个示例 <a class="header-anchor" href="#逃逸技术的两个示例" aria-label="Permalink to &quot;逃逸技术的两个示例&quot;">​</a></h2><p>如下所示，这两段代码就是典型的情况2，将对象传给未知代码，造成逃逸</p><div class="language-java line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#676E95;font-style:italic;">/**</span></span>
<span class="line"><span style="color:#676E95;font-style:italic;"> * </span><span style="color:#F78C6C;font-style:italic;">@author</span><span style="color:#676E95;font-style:italic;"> binghe</span></span>
<span class="line"><span style="color:#676E95;font-style:italic;"> * @description 对象逃逸示例2</span></span>
<span class="line"><span style="color:#676E95;font-style:italic;"> */</span></span>
<span class="line"><span style="color:#C792EA;">public</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">class</span><span style="color:#A6ACCD;"> </span><span style="color:#FFCB6B;">ObjectReturn</span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#C792EA;">public</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">User</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">createUser</span><span style="color:#89DDFF;">(){</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#C792EA;">User</span><span style="color:#A6ACCD;"> user </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">new</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">User</span><span style="color:#89DDFF;">();</span></span>
<span class="line"><span style="color:#A6ACCD;">        </span><span style="color:#89DDFF;font-style:italic;">return</span><span style="color:#A6ACCD;"> user</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br></div></div><h2 id="逃逸分析带来的好处" tabindex="-1">逃逸分析带来的好处 <a class="header-anchor" href="#逃逸分析带来的好处" aria-label="Permalink to &quot;逃逸分析带来的好处&quot;">​</a></h2><h3 id="对象可能分配在栈上" tabindex="-1">对象可能分配在栈上 <a class="header-anchor" href="#对象可能分配在栈上" aria-label="Permalink to &quot;对象可能分配在栈上&quot;">​</a></h3><p><code>JVM</code>会判断这个对象使用范围，若没有发生逃逸则将对象分配在栈上，这样做的好处就是创建销毁速度会相对快些，而且节省堆区内存，避免GC开销。</p><h3 id="分离对象或标量替换" tabindex="-1">分离对象或标量替换 <a class="header-anchor" href="#分离对象或标量替换" aria-label="Permalink to &quot;分离对象或标量替换&quot;">​</a></h3><p>由上文我们知道，对象有可能会被分配在栈上，那么<code>JVM</code>就会将这个对象打散，将对象打散为无数个小的局部变量，这样就方便在栈上分配内存了。</p><p>如下所示，若这段代码没有发生逃逸，则<code>JVM</code>会避免创建<code>Point</code></p><div class="language-java line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#C792EA;">public</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">static</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">void</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">main</span><span style="color:#89DDFF;">(</span><span style="color:#C792EA;">String</span><span style="color:#A6ACCD;"> args</span><span style="color:#89DDFF;">[])</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#82AAFF;">alloc</span><span style="color:#89DDFF;">();</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#C792EA;">class</span><span style="color:#A6ACCD;"> </span><span style="color:#FFCB6B;">Point</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#C792EA;">private</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">int</span><span style="color:#A6ACCD;"> x</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#C792EA;">private</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">int</span><span style="color:#A6ACCD;"> y</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span>
<span class="line"><span style="color:#C792EA;">private</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">static</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">void</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">alloc</span><span style="color:#89DDFF;">()</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#C792EA;">Point</span><span style="color:#A6ACCD;"> point </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;font-style:italic;">new</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">Point</span><span style="color:#89DDFF;">(</span><span style="color:#F78C6C;">1</span><span style="color:#89DDFF;">,</span><span style="color:#F78C6C;">2</span><span style="color:#89DDFF;">);</span></span>
<span class="line"><span style="color:#A6ACCD;">    System</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">out</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">println</span><span style="color:#89DDFF;">(</span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">point.x</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">+</span><span style="color:#A6ACCD;"> point</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">x </span><span style="color:#89DDFF;">+</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">;point.y</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">+</span><span style="color:#A6ACCD;"> point</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">y</span><span style="color:#89DDFF;">);</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br></div></div><p>代码就会被标量替换，如下所示，避免创建对象，而是用局部变量进行操作。</p><div class="language-java line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">java</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#C792EA;">private</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">static</span><span style="color:#A6ACCD;"> </span><span style="color:#C792EA;">void</span><span style="color:#A6ACCD;"> </span><span style="color:#82AAFF;">alloc</span><span style="color:#89DDFF;">()</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#C792EA;">int</span><span style="color:#A6ACCD;"> x </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#F78C6C;">1</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#A6ACCD;">    </span><span style="color:#C792EA;">int</span><span style="color:#A6ACCD;"> y </span><span style="color:#89DDFF;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#F78C6C;">2</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#A6ACCD;">    System</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">out</span><span style="color:#89DDFF;">.</span><span style="color:#82AAFF;">println</span><span style="color:#89DDFF;">(</span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">point.x = </span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">+</span><span style="color:#A6ACCD;"> x </span><span style="color:#89DDFF;">+</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">&quot;</span><span style="color:#C3E88D;">; point.y=</span><span style="color:#89DDFF;">&quot;</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">+</span><span style="color:#A6ACCD;"> y</span><span style="color:#89DDFF;">);</span></span>
<span class="line"><span style="color:#89DDFF;">}</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br></div></div><h3 id="同步锁消除" tabindex="-1">同步锁消除 <a class="header-anchor" href="#同步锁消除" aria-label="Permalink to &quot;同步锁消除&quot;">​</a></h3><p>如果<code>JVM</code>分析到这个锁只有一个对象会用到就会将这个锁消除。如下代码<code>JVM</code>看到是字符串拼接操作，就会优化为使用到<code>StringBuffer</code>或<code>StringBuilder</code>。</p><div class="language-bash line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki material-theme-palenight"><code><span class="line"><span style="color:#FFCB6B;">public</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">static</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">String</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">test03</span><span style="color:#89DDFF;">(</span><span style="color:#FFCB6B;">String</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s1,</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">String</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s2,</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">String</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s3</span><span style="color:#89DDFF;">)</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">{</span></span>
<span class="line"><span style="color:#A6ACCD;">     </span><span style="color:#FFCB6B;">String</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">=</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s1</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">+</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s2</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">+</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s3</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#A6ACCD;">     </span><span style="color:#89DDFF;font-style:italic;">return</span><span style="color:#A6ACCD;"> </span><span style="color:#C3E88D;">s</span><span style="color:#89DDFF;">;</span></span>
<span class="line"><span style="color:#A6ACCD;"> }</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br></div></div><p>经过逃逸分析发现，是无锁竞争环境，就使用<code>StringBuilder</code>，如下所示</p><p><img src="https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301435808.png" alt="在这里插入图片描述" data-fancybox="gallery"></p><h2 id="参考文献" tabindex="-1">参考文献 <a class="header-anchor" href="#参考文献" aria-label="Permalink to &quot;参考文献&quot;">​</a></h2><p><a href="https://mdnice.com/writing/0e00579d830d4d519a5f862d2ea08527#:~:text=%E9%80%83%E9%80%B8%E5%88%86%E6%9E%90%E5%B0%B1%E6%98%AF%EF%BC%9A%E4%B8%80,%E5%8F%AF%E4%BB%A5%E8%AE%BF%E9%97%AE%E5%88%B0%E6%8C%87%E9%92%88%E3%80%82" target="_blank" rel="noreferrer">逃逸分析，yyds！！</a></p>`,22);function F(l,d,b,u,m,E){const p=n("ArticlesMetadata"),o=n("ClientOnly");return y(),t("div",null,[D,s(o,null,{default:r(()=>[s(p,{article:l.$frontmatter},null,8,["article"])]),_:1}),A])}const g=e(C,[["render",F]]);export{_ as __pageData,g as default};
