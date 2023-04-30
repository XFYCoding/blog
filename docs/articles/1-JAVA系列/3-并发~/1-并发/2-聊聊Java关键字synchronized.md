# 聊聊Java关键字synchronized

## synchronized是什么有什么用？

synchronized是在多线程场景经常用到的关键字，通过synchronized将共享资源设置为临界资源，确保并发场景下共享资源操作的正确性。

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071105819.png)

## synchronized基础使用示例

### synchronized作用于静态方法

synchronized作用于静态方法上，锁的对象为Class，这就意味着方法的调用者无论是Class还是实例对象都可以保持互斥，所以下面这段代码的结果为200

```java
public class SynchronizedDemo {
private static Logger logger = LoggerFactory.getLogger(SynchronizedDemo.class);

    private static int count = 0;

    /**
     * synchronized作用域静态类上
     */
    public synchronized static void method() {
        count++;
    }

   @Test
    public  void test() {
        IntStream.rangeClosed(1,1_0000)
                .parallel()
                .forEach(i->SynchronizedDemo.method());

        IntStream.rangeClosed(1,1_0000)
                .parallel()
                .forEach(i->new SynchronizedDemo().method());


        logger.info("count:{}",count);

    }

}
```

输出结果

```java
2023-03-16 20:58:43,699 INFO  SynchronizedDemo:33 - count:200
```

### synchronized作用于方法

作用于方法上，则锁住的对象是调用的示例对象，如果我们使用下面这段写法，最终的结果却不是10000。

```java
   private static Logger logger = LoggerFactory.getLogger(SynchronizedDemo.class);
private static int count = 0;
/*** synchronized作用域实例方法上
 */
public synchronized void method() {
    count++;
}
@Test
public void test() {
    IntStream.rangeClosed(1, 1 _0000).parallel().forEach(i - > new SynchronizedDemo().method());
    logger.info("count:{}", count);
}
```

输出结果

```java
2023-03-16 21:03:44,300 INFO  SynchronizedDemo:30 - count:8786
```

因为synchronized 作用于实例方法，会导致每个线程获得的锁都是各自使用的实例对象，而++操作又非原子操作,导致互斥失败进而导致数据错误。 什么是原子操作呢？通俗的来说就是一件事情只要一条指令就能完成，而count++在底层汇编指令如下所示，可以看到++操作实际上是需要3个步骤完成的:

1. 从内存将count读取到寄存器
2. count自增
3. 写回内存

```java
__asm
{
        moveax,  dword ptr[i]
        inc eax
        mov dwordptr[i], eax
}
```

正是由于锁互斥的失败，导致两个线程同时到临界区域加载资源，获得的count都是0，经过自增后都是1，导致数据少了1。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301355089.png)

所以正确的使用方式是多个线程使用同一个对象调用该方法

```java
SynchronizedDemo demo = new SynchronizedDemo();
IntStream.rangeClosed(1, 1 _0000).parallel().forEach(i - > demo.method());
logger.info("count:{}", count);
```

这样一来输出的结果就正常了。

```java
2023-03-16 23:08:23,656 INFO  SynchronizedDemo:31 - count:10000
```

### synchronized作用于代码块

作用于代码块上的synchronized锁住的就是括号内的对象实例，以下面这段代码为例，锁的就是当前调用者。

```java
public void method() {
    synchronized(this) {
        count++;
    }
}
```

所以我们的使用的方式还是和作用与实例方法上一样。

```java
@Test
public void test() {
    SynchronizedDemo demo = new SynchronizedDemo();
    IntStream.rangeClosed(1, 1 _0000).parallel().forEach(i - > demo.method());
    logger.info("count:{}", count);
}
```

输出结果也是10000

```java
2023-03-16 23:11:08,496 INFO  SynchronizedDemo:33 - count:10000
```

## 深入理解synchronized关键字

### synchronized实现原理

我们先来写一段简单的Java程序，synchronized作用于代码块中

```java
public class SynchronizedDemo {
    private static int count = 0;
    /**
     * synchronized作用域实例方法上
     */
    public void method() {
        synchronized(this) {
            count++;
        }
    }
    public static void main(String[] args) {
        SynchronizedDemo demo = new SynchronizedDemo();
        IntStream.rangeClosed(1, 1 _0000).parallel().forEach(i - > demo.method());
        System.out.println("count:" + count);
    }
}
```

先使用javac指令生成class文件

```java
javac SynchronizedDemo.java
```

然后再使用反编译javap

```java
javap -c -s -v  SynchronizedDemo.class
```

最终我们可以看到method方法的字节码指令，可以看到关键字synchronized 的锁是通过monitorenter和monitorexit来确保线程间的同步。

```java
 public void method();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=2, locals=3, args_size=1
         0: aload_0
         1: dup
         2: astore_1
         3: monitorenter
         4: getstatic     #2                  // Field count:I
         7: iconst_1
         8: iadd
         9: putstatic     #2                  // Field count:I
        12: aload_1
        13: monitorexit
        14: goto          22
        17: astore_2
        18: aload_1
        19: monitorexit
        20: aload_2
        21: athrow
        22: return
```

我们再将synchronized 关键字改到方法上再次进行编译和反编译

```java
public synchronized void method() {
    count++;
}
```

可以看到synchronized 实现锁的方式编程了通过ACC_SYNCHRONIZED关键字来标明该方法是一个同步方法。

```java
 public synchronized void method();
    descriptor: ()V
    flags: ACC_PUBLIC, ACC_SYNCHRONIZED
    Code:
      stack=2, locals=1, args_size=1
         0: getstatic     #2                  // Field count:I
         3: iconst_1
         4: iadd
         5: putstatic     #2                  // Field count:I
         8: return
      LineNumberTable:
        line 17: 0
        line 19: 8
```

了解了不同synchronized在不同位置使用的指令之后，我们再来聊聊这些指令如何实现"锁"的。

我们每个线程使用的实例对象都有一个对象头，每个对象头中都有一个Mark Word，当我们使用synchronized 关键字时，这个Mark Word就会指向一个monitor。 这个monitor锁就是一种同步工具，是实现线程操作临界资源互斥的关键所在，在Java虚拟机(HotSpot)中，monitor就是通过ObjectMonitor实现的。

其代码如下，我们可以看到_EntryList、_WaitSet 、_owner三个关键属性。

```java
ObjectMonitor() {
    _header       = NULL;
    _count        = 0; // 记录线程获取锁的次数
    _waiters      = 0,
    _recursions   = 0;  //锁的重入次数
    _object       = NULL;
    _owner        = NULL;  // 指向持有ObjectMonitor对象的线程
    _WaitSet      = NULL;  // 处于wait状态的线程，会被加入到_WaitSet
    _WaitSetLock  = 0 ;
    _Responsible  = NULL ;
    _succ         = NULL ;
    _cxq          = NULL ;
    FreeNext      = NULL ;
    _EntryList    = NULL ;  // 处于等待锁block状态的线程，会被加入到该列表
    _SpinFreq     = 0 ;
    _SpinClock    = 0 ;
    OwnerIsThread = 0 ;
  }
```

我们假设自己现在就是一个需要获取锁的线程，要获取ObjectMonitor锁，所以我们经过了下面几个步骤:

1. 进入_EntryList。
2. 尝试取锁，发现_owner区被其他线程持有，于是进入_WaitSet 。
3. 其他线程用完锁，将count--变为0，释放锁，_owner被清空。
4. 我们有机会获取_owner，尝试争抢，成功获取锁，_owner指向我们这个线程，将count++。
5. 我们操作到一半发现CPU时间片用完了，调用wait方法，线程再次进入_WaitSet ，count--变为0，_owner被清空。
6. 我们又有机会获取_owner，尝试争抢，成功获取锁，将count++。
7. 这一次，我们用完临界资源，准备释放锁，count--变为0，_owner清空，其他线程继续进行monitor争抢。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301355621.png)

### synchronized如何保证可见性、有序性、可重入性

#### 可见性

每个线程使用synchronized获得锁操作临界资源时，首先需要获取临界资源的值，为了保证临界资源的值是最新的，JMM模型规定线程必须将本地工作内存清空，到共享内存中加载最新的进行操作。 当前线程上锁后，其他线程是无法操作这个临界资源的。 当前线程操作完临界资源之后，会立刻将值写回内存中，正是由于每个线程操作期间其他线程无法干扰，且临界资源数据实时同步，所以synchronized关键字保证了临界资源数据的可见性。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301422523.png)

#### 有序性

synchronized同步的代码块具备排他性，这就意味着同一个时刻只有一个线程可以获得锁，synchronized代码块的内部资源是单线程执行的。 synchronized遵守as-if-serial原则，可以当线程线程修改最终结果是有序的,注意这里笔者说的保证最终结果的有序性。

具体例子，某段线程得到锁Test.class之后，执行临界代码逻辑，可能会先执行变量b初始化的逻辑，在执行a变量初始化的逻辑，但是最终结果都会执行a+b的逻辑。这也就我们的说的保证最终结果的有序，而不保证执行过程中的指令有序。

```java
 synchronized(Test.class) {
     int a = 1;
     int b = 2;
     int c = a + b;
 }
```

#### 可重入性

Java允许同一个线程获取同一把锁两次，即可重入性，原因我们上文将synchronized相关的ObjectMonitor锁已经提到了，ObjectMonitor有一个count变量就是用于记录当前线程获取这把锁的次数。 就像下面这段代码，例如我们的线程T1，两次执行synchronized 获取锁Test.class两次，count就自增两次变为2。 退出synchronized关键字对应的代码块，count就自减，变为0时就代表释放了这把锁，其他线程就可以争抢这把锁了。所以当我们的线程退出下面的两个synchronized 代码块时，其他线程就可以争抢Test.class这把锁了。

```java
public void add2() {
    synchronized(Test.class) {
        synchronized(Test.class) {
            list.add(1);
        }
    }
}
```

### synchronized锁粗化和锁消除

#### 锁粗化

当jvm发现操作的方法连续对同一把锁进行加锁、解锁操作，就会对锁进行粗化，所有操作都在同一把锁中完成。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301422134.png)

如下代码，StringBuffer的append方法有synchronized关键字，这意味每次追加操作都会上对象锁，代码中涉及连续3个字符串的追加，jvm发现这一点就会对其进行优化，将3次append操作合并，用一次锁定完成。

```java
/**
 * 锁粗化
 * @param s1
 * @param s2
 * @param s3
 * @return
 */
public static String test04(String s1, String s2, String s3) {
    StringBuffer sb = new StringBuffer();
    //锁粗化后下面3个append会在同一个锁中执行
    sb.append(s1);
    sb.append(s2);
    sb.append(s3);
    return sb.toString();
}
```

锁粗化后的效果，大概像下面这段代码:

```java
public static String test04(String s1, String s2, String s3) {
    StringBuilder sb = new StringBuilder();
    synchronized(sb) {
        sb.append(s1);
        sb.append(s2);
        sb.append(s3);
    }
    return sb.toString();
}
```

#### 锁消除

虚拟机在JIT即时编译运行时，对一些代码上要求同步，但是检测到不存在共享数据的锁的进行消除。

下面这段代码涉及字符串拼接操作，所以jvm会将其优化为StringBuffer或者StringBuilder，至于选哪个，这就需要进行逃逸分析了。逃逸分析通俗来说就是判断当前操作的对象是否会逃逸出去被其他线程访问到。

关于逃逸分析可以可以参考笔者的这篇文章[来聊聊逃逸分析(opens new window)](http://t.csdn.cn/BI2Py)

例如我们下面的result ，是局部变量，没有发生逃逸，所以完全可以当作栈上数据来对待，是线程安全的，所以jvm进行锁消除，使用StringBuilder完成字符串拼接。

```java
public String appendStr(String str1, String str2, String str3) {
    String result = str1 + str2 + str3;
    return result;
}
```

这一点我们可以在字节码文件中得到印证

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301422173.png)

### synchronized的锁升级

#### 原理讲述

synchronized关键字在JDK1.6之前底层都是直接调用ObjectMonitor的enter和exit完成对操作系统级别的重量级锁mutex的使用，这使得每次上锁都需要从用户态转内核态尝试获取重量级锁的过程。 这种方式也不是不妥当，在并发度较高的场景下，取不到mutex的线程会因此直接阻塞，到等待队列_WaitSet 中等待唤醒，而不是原地自选等待其他线程释放锁而立刻去争抢，从而避免没必要的线程原地自选等待导致的CPU开销，这也就是我们上文中讲到的synchronized工作原理的过程。

但是在并发度较低的场景下，可能就10个线程，竞争并不激烈可能线程等那么几毫秒就可以拿到锁了，而我们每个线程却还是需要不断从用户态到内核态获取重量级锁、到_WaitSet 中等待机会的过程，这种情况下，可能功能的开销还不如所竞争的开销来得激烈。

所以JDK1.6之后，HotSpot虚拟机就对synchronized底层做了一定的优化，通俗来说根据线程竞争的激烈程度的不断增加逐步进行锁升级的策略。

我们假设有这样一个场景，我们有一个锁对象LockObj，我们希望用它作为锁，使用代码逻辑如下所示:

```java
synchronized(LockObj){

//dosomething
}
```

我们把自己当作一个线程，一开始没有线程竞争时，synchronized锁就是无锁状态，无需进行任何锁争抢的逻辑。此时锁对象LockObj的偏向锁标志位为0，锁标记为01。

随着时间推移有几个线程开始竞争，竞争并不激烈的时候，就将锁升级为偏向锁，此时作为锁的对象LockObj的对象头偏向锁标记为1，锁标记为01，我们的线程开始尝试获取这把锁，如果获得这把锁或者发现持有这把锁的线程id就是我们自己，则直接操作临界资源即可。当我们发现偏向锁中指向的线程id不是我们时，就执行下面的逻辑:

1. 我们尝试CAS竞争这把锁，如果成功则将锁对象的markdown中的线程id设置为我们的线程id，然后执行代码逻辑。
2. 我们尝试CAS竞争这把锁失败，则当持有锁的线程到达安全点的时候，直接将这个线程挂起，将偏向锁升级为轻量级锁，然后持有锁的线程继续自己的逻辑，我们的线程继续等待机会。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301422565.png)

这里可能有读者好奇什么叫安全点？

这里我们可以通俗的理解一下，安全点就是代码执行到的一个特殊位置，当线程执行到这个位置时，我们可以将线程暂停下来，让我们在暂停期间做一些处理。我们上文中将偏向锁升级为轻量级锁就是在安全点将线程暂停一下，将锁升级为轻量级锁，然后再让线程进行进一步的工作。

关于安全点的更多介绍，可以参考这篇文章

[每日一面 - 什么是 Safepoint？(opens new window)](https://zhuanlan.zhihu.com/p/345034354)

升级为轻量级锁时，偏向锁标记为0，锁标记变为是00。此时，如果我们的线程需要获取这个轻量级锁时的过程如下:

1. 判断当前这把锁是否为轻量级锁，如果是则在线程栈帧中划出一块空间，存放这把锁的信息，我们这里就把它称为"锁记录"，并将锁对象的markword复制到锁记录中。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301422020.png)

1. 复制成功之后，通过CAS的方式尝试将锁对象头中markword更新为锁记录的地址，并将owner指向锁对象头的markword。如果这几个步骤操作成功，则说明取锁成功了。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301355082.png)

1. 如果失败，jvm则会去查看锁对象中的markword是否指向我们的锁空间，如果是我们的线程则代表锁重入，则我们的线程可以操作临界资源。如果不是我们的线程，则说明这把锁被别的线程持有了，我们再次进行原地自旋等待，如果自旋超过10次(默认设置为10次)还没有得到锁则将锁升级为重量级锁。

升级为重量级锁时，锁标记为0，锁状态为10。

#### 小结

经过上述的讲解我们对锁升级有了一个全流程的认识，在这里做个阶段小结:

1. 无线程竞争，无锁状态:偏向锁标记为0，锁标记为01。
2. 存在一定线程竞争，大部分情况下会是同一个线程获取到，升级为偏向锁，偏向标记为1，锁标记为01。
3. 线程CAS争抢偏向锁锁失败，锁升级为轻量级锁，偏向标记为0，锁标记为00。
4. 线程原地自旋超过10次还未取得轻量级锁，锁升级为重量级锁，避免大量线程原地自旋造成没必要的CPU开销，偏向锁标记为0，锁标记为10。

#### 代码印证

上文我们将自己当作一个线程了解完一次锁升级的流程，口说无凭，所以我们通过可以通过代码来印证我们的描述。

上文讲解锁升级的之后，我们一直在说对象头的概念，所以为了能够直观的看到锁对象中对象头锁标记和锁状态的变化，我们这里引入一个jol工具。

```java
<dependency>
    <groupId>org.openjdk.jol</groupId>
    <artifactId>jol-core</artifactId>
    <version>0.11</version>
    <scope>provided</scope>
</dependency>
```

然后我们声明一下锁对象作为实验对象。

```java
public class Lock {
    private int count;

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }
}
```

首先是无锁状态的代码示例，很简单，没有任何线程争抢逻辑，就通过jol工具打印锁对象信息即可。

```java
public class Lockless {
    public static void main(String[] args) {
        Lock object=new Lock();
        System.out.println(ClassLayout.parseInstance(object).toPrintable());
    }
}
```

打印结果如下，我们只需关注第一行的object header，可以看到第一列的00000001，我们看到后3位为001，偏向锁标记为0，锁标记为01，001这就是我们说的无锁状态。

```java
com.zsy.lock.lockUpgrade.Lock object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           01 00 00 00 (00000001 00000000 00000000 00000000) (1)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           43 c1 00 20 (01000011 11000001 00000000 00100000) (536920387)
     12     4    int Lock.count                                0
Instance size: 16 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

接下来是偏向锁，我们还是用同样的代码即可，需要注意的是偏向锁必须在jvm启动后的一段时间才会运行，所以如果我们想打印偏向锁必须让线程休眠那么几秒，这里笔者就偷懒了一下，通过设置jvm参数`-XX:+UseBiasedLocking -XX:BiasedLockingStartupDelay=0`，通过禁止偏向锁延迟，直接打印出偏向锁信息

```java
public class BiasLock {
    public static void main(String[] args) {
        Lock object = new Lock();
        System.out.println(ClassLayout.parseInstance(object).toPrintable());
    }
}
```

输出结果如下，可以看到对象头的信息为00000101，此时锁标记为1即偏向锁标记，锁标记为01，101即偏向锁。

```java
com.zsy.lock.lockUpgrade.Lock object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           05 00 00 00 (00000101 00000000 00000000 00000000) (5)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           43 c1 00 20 (01000011 11000001 00000000 00100000) (536920387)
     12     4    int Lock.count                                0
Instance size: 16 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

然后的轻量级锁的印证，我们只需使用Lock对象作为锁即可。

```java
public class LightweightLock {
    public static void main(String[] args) {
        Lock object = new Lock();
        synchronized (object) {
            System.out.println(ClassLayout.parseInstance(object).toPrintable());
        }
    }
}
```

可以看到轻量级锁锁标记为0，锁标记为00，000即轻量级。

```java
com.zsy.lock.lockUpgrade.Lock object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           e8 f1 96 02 (11101000 11110001 10010110 00000010) (43446760)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           43 c1 00 20 (01000011 11000001 00000000 00100000) (536920387)
     12     4    int Lock.count                                0
Instance size: 16 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

最后就是重量级锁了，我们只需打印出锁对象的哈希码即可将其升级为重量级锁。

```java
public class HeavyweightLock {
    public static void main(String[] args) {
        Lock object = new Lock();
        synchronized (object) {
            System.out.println(object.hashCode());
        }

        synchronized (object) {
            System.out.println(ClassLayout.parseInstance(object).toPrintable());

        }
    }
}
```

输出结果为10001010，偏向锁标记为0，锁标记为10，010为重量级锁。

```java
1365202186
com.zsy.lock.lockUpgrade.Lock object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           8a 15 83 17 (10001010 00010101 10000011 00010111) (394466698)
      4     4        (object header)                           00 00 00 00 (00000000 00000000 00000000 00000000) (0)
      8     4        (object header)                           43 c1 00 20 (01000011 11000001 00000000 00100000) (536920387)
     12     4    int Lock.count                                0
Instance size: 16 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

### synchronized和ReentrantLock的区别

我们可以从三个角度来了解两者的区别:

1. 从实现角度:synchronized是JVM层面实现的锁，ReentrantLock是属于Java API层面实现的锁，所以用起来需要我们手动上锁lock和释放锁unlock。
2. 从性能角度:在JDK1.6之前可能ReentrantLock性能更好，在JDK1.6之后由于JVM对synchronized增加适应性自旋锁、锁消除等策略的优化使得synchronized和ReentrantLock性能并无太大的区别。
3. 从功能角度:ReentrantLock相比于synchronized增加了更多的高级功能，例如等待可中断、公平锁、选择性通知等功能。

## synchronized使用注意事项

### 正确锁住共享资源保证原子性

看下面这段代码，有两个volatile变量a、b，然后有两个线程操作这两个变量，一个变量对a、b进行自增，另一个线程发现a<b的时候就打印a>b的结果。

```java
@Slf4j
public class Interesting {

    private volatile int a = 1;
    private volatile int b = 1;



    public  void add() {
        log.info("add start");
        for (int i = 0; i < 100_0000; i++) {
            a++;
            b++;
        }

        log.info("add done");
    }


    public  void compare() {
        log.info("compare start");
        for (int i = 0; i < 100_0000; i++) {
            //如果a<b，则打印a>b的结果
            if (a < b) {
                log.info("a：{},b:{},a>b:{}  ", a, b, a > b);
            }
        }

        log.info("compare done");
    }


    public static void main(String[] args) throws InterruptedException {
        CountDownLatch countDownLatch = new CountDownLatch(2);
        Interesting interesting = new Interesting();

        //线程1
        new Thread(() -> {
            interesting.add();
            countDownLatch.countDown();
        },"t1").start();


        //线程2
        new Thread(() -> {
            interesting.compare();
            countDownLatch.countDown();
        },"t2").start();


        countDownLatch.await();
    }

}
```

结果出现了很奇怪的现象，我们发现进行了某些线程得到了进入了a<b的if分支，a>b结果却为true，原因是什么呢？

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301423513.png)

笔者这里就通过idea的debug模式来重现这个问题，首先我们需要清除Java编译后执行的代码并不一定会按照我们编写的顺序执行，所以我们的线程1执行的add方法可能变成下面这个样子

```java
 public void add() {
     log.info("add start");
     for(int i = 0; i < 100 _0000; i++) {
         b++;
         a++;
     }
     log.info("add done");
 }
```

通过手动调整顺序模拟jvm指令重排之后，我们对add和compare方法分别插上断点，模式调整为thread模式。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301423969.png)

首先我们强制将执行权给线程1，将b完成自增，再将线程切回线程2，让线程2的代码可以通过if判断。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301423476.png)

代码切回线程2，我们让其走过if判断，此时a确实小于b，为了能够首先a大于b，我们再将线程切回线程1。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301423766.png)

回到线程1，此时代码正准备执行a自增逻辑，我们完成一次自增后a为2，等于b。

为了下一轮循环a先++然后线程切换回b出现a大于b的情况，笔者这里直接使用alt+F8分析模式手动多完成一次++操作，使得a变为3，模拟下一轮指令重排a在b前面的情况。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301423042.png)

再将执行权切回线程2，此时判断通过a<b，可输出结果a却大于b。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301424456.png)

输出结果

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301424075.png)

总结一下，造成这个问题的原因就是我们使用volatile保证了两个变量的可见性，确保一个线程变量对于另一个线程是可见的。但我们没有保证原子性，即双方的操作都可以被彼此打断，解决方式也很简单，观察一下我们的代码，两个线程操作的变量都是实例对象的值，所以我们一方操作时只要锁住实例对象即可。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301424407.png)

所以我们都在实例方法上添加一个synchronized 关键字，确保每一次操作都能锁住实例对象，避免另一个线程操作。

```java
 public synchronized void add() {
     log.info("add start");
     for(int i = 0; i < 100 _0000; i++) {
         b++;
         a++;
     }
     log.info("add done");
 }
 public synchronized void compare() {
     log.info("compare start");
     for(int i = 0; i < 100 _0000; i++) {
         //如果a<b，则打印a>b的结果
         if(a < b) {
             log.info("a：{},b:{},a>b:{}  ", a, b, a > b);
         }
     }
     log.info("compare done");
 }
```

再次调试代码发现，线程2工作期间线程1是处于监视锁释放阶段，无法切换过去，线程互斥成功，问题解决。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301424132.png)

输出结果没有意外发生

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071105504.png)

### 确保锁住的对象和锁属于统一层级

在来看一个例子，我们现在有这么一个Data 对象,它包含一个静态变量counter。还有一个重置变量值的方法reset。

```java
@Slf4j
public class Data {

    @Getter
    @Setter
    private static int counter = 0;


	public static int reset() {
        counter = 0;
        return counter;
    }

  
}
```

这个变量需要被多线程操作，于是我们给它添加了一个add方法

```java
public synchronized void wrongAdd() {
    counter++;
}
```

测试代码如下，你们猜猜最终的结果是多少呢？

```java
public static void main(String[] args) {
    Data.reset();
    IntStream.rangeClosed(1, 100 _0000).parallel().forEach(i - > {
        new Data().wrongAdd();
    });
    log.info("counter:{}", Data.getCounter());
}
```

输出结果如下，感兴趣的读者可以试试看，这个值几乎每一次都不一样。原因是什么呢？

```java
2023-03-19 14:42:53,006 INFO  Data:54 - counter:390472
```

仔细看看我们的add方法，它在实例上方法上锁，锁的对象是当前对象，在看看我们的代码并行流中的每一个线程的写法，永远都是new一个data对象执行add方法，大家各自用各自的锁，很可能出现两个线程同时读取到一个值0，然后一起自增1，导致最终结果变为1而不是2。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301425314.png)

解决方式也很可能，如果可以改变调用方式，那么我们就让所有线程使用同一个实例对象即可

```java
 public static void main(String[] args) {
     Data.reset();
     Data data = new Data();
     IntStream.rangeClosed(1, 100 _0000).parallel().forEach(i - > {
         data.wrongAdd();
     });
     log.info("counter:{}", Data.getCounter());
 }
```

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301425998.png)

输出结果

```java
2023-03-19 14:44:26,972 INFO  Data:55 - counter:1000000
```

如果不能改变调用方式，我们就修改调用方法，让所有对象实例都用同一把锁。

```java
private static Object locker = new Object();
public synchronized void rightAdd() {
    synchronized(locker) {
        counter++;
    }
}
```

调用代码如下:

```java
public static void main(String[] args) {
    Data.reset();
    IntStream.rangeClosed(1, 100 _0000).parallel().forEach(i - > {
        new Data().rightAdd();
    });
    log.info("counter:{}", Data.getCounter());
}
```

可以看到输出结果也是正确的

```java
2023-03-19 14:55:21,095 INFO  Data:56 - counter:1000000
```

### 避免锁的粒度过粗

有时候我们锁使用的确实没有错，但是锁的粒度太粗了，将一些非常耗时的方法放到锁里面，导致性能问题，就像下面这段代码。我们用slow模拟耗时的方法，将slow放到锁里面，这意味每个线程得到锁就必须等待上一个线程完成这个10毫秒的方法加需要上锁的业务逻辑才行。

```java
private static List < Object > list = new ArrayList < > ();
public void slow() {
    try {
        TimeUnit.MILLISECONDS.sleep(10);
    } catch(InterruptedException e) {
        e.printStackTrace();
    }
}
public void add() {
    synchronized(Test.class) {
        slow();
        list.add(1);
    }
}
```

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301425606.png)

我们的压测代码如下

```java
 StopWatch stopWatch = new StopWatch();
 stopWatch.start("add ");
 IntStream.rangeClosed(1, 1000).parallel().forEach(i - > {
     new Test().add();
 });
 stopWatch.stop();
 Assert.isTrue(list.size() == 1000, "size error");
```

输出结果如下，可以看到1000个并行流就使用了15s多。

```java
-----------------------------------------
ms     %     Task name
-----------------------------------------
15878  084%  add 
```

所以我们需要对这个代码进行一次改造，将耗时的操作放到锁外面，让各自线程执行完再去获得锁

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301426174.png)

```java
public void add2() {
    slow();
    synchronized(Test.class) {
        list.add(1);
    }
}
```

我们再来完整压测一次

```java
@Test
public void test() {
    StopWatch stopWatch = new StopWatch();
    stopWatch.start("add ");
    IntStream.rangeClosed(1, 1000).parallel().forEach(i - > {
        new Test().add();
    });
    stopWatch.stop();
    Assert.isTrue(list.size() == 1000, "size error");
    list.clear();
    stopWatch.start("add2 ");
    IntStream.rangeClosed(1, 1000).parallel().forEach(i - > {
        new Test().add2();
    });
    stopWatch.stop();
    Assert.isTrue(list.size() == 1000, "size error");
    log.info(stopWatch.prettyPrint());
}
```

可以看到改造后的性能远远高于前者

```java
2023-03-19 15:10:47,888 INFO  Test:69 - StopWatch '': running time (millis) = 18853
-----------------------------------------
ms     %     Task name
-----------------------------------------
15878  084%  add 
02975  016%  add2 
```

### 锁使用不当导致的死锁问题

有时候锁使用不当可能会导致线程死锁，其中造成死锁最经典的原因就是环路等待。

如下图，线程1获取锁1之后还要获取锁2，才能操作临界资源，这意味着线程1必须同时拿到两把锁完成手头工作后才能释放锁。 同理线程2先获取锁2再去获取锁1，才能操作临界资源，同样必须操作完临界资源后才能释放锁。双方就这样拿着对方需要的东西互相阻塞僵持着，造成死锁。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301429022.png)

我们现在有这样一个需求，不同用户需要购买不同的商品，用户执行库存扣减的时候必须拿到所有需要购买的商品的锁才成完成库存扣减。

例如用户1想购买笔者本和手机，它就必须同时拿到手机和笔者本两个商品的锁才能操作资源。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301429235.png)

这种做法可能会导致死锁问题，举个例子，有个用户打算先买笔者本再买手机，另一个用户打算先买手机再买笔者本，这使得他们获取锁的顺序是相反的，如果他们同时执行业务逻辑。双方先取的各自的第一把锁，准备尝试获取第二把锁的时候发现锁被对方持有，双方僵持不下，造成线程死锁。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301429995.png)

接下来我们就用一个spring boot的web应用来演示一下，首先我们先来看看商品表，可以看到P001为笔记本，P002为手表。

```java
SELECT * FROM product p ;
```

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301429631.png)

为了保证所有的商品的锁只有一把，我们会使用一个静态变量来存储所有商品的锁。所以我们现在controller上定义一个静态变量productDTOMap ，key为商品的code，value为商品对象，这个商品对象中就包含扣减库存时需要用到的锁。

```java
 private static Map<String, ProductDTO> productDTOMap = new HashMap<>();
```

然后我们的controller就用InitializingBean 这个扩展点完成商品锁的加载。

```java
@RestController
@RequestMapping()
public class ProductController implements InitializingBean {


 	@Override
    public void afterPropertiesSet() throws Exception {
        //获取商品
        List<Product> productList = productService.list();
        //将商品转为map，用code作为key，ProductDTO 作为value，并为其设置锁ReentrantLock
        productDTOMap = productList.stream()
                .collect(Collectors.toMap(p -> p.getProductCode(), p -> {
                    ProductDTO dto = new ProductDTO();
                    dto.setLock(new ReentrantLock());
                    return dto;
                }));


    }

}
```

接下来就能编写我们的库存扣减的逻辑了，步骤很简单:

1. 根据用户传入的code找到对应的商品对象。
2. 获取要购买的商品的锁。
3. 所有锁都拿到完成商品扣减，有一把锁没拿到则将所有的锁都释放并返回false告知用户本地下单失败。

```java
@PostMapping("/product/deductCount")
ResultData < Boolean > deductCount(@RequestBody List < String > codeList) {
    //获取商品
    QueryWrapper < Product > query = new QueryWrapper < > ();
    query.in("PRODUCT_CODE", codeList);
    //存储用户获得的锁
    List < ReentrantLock > lockList = new ArrayList < > ();
    //遍历每个商品对象,并尝试获得这些商品的锁
    for(String code: codeList) {
        if(productDTOMap.containsKey(code)) {
            try {
                ReentrantLock lock = productDTOMap.get(code).getLock();
                //如果得到这把锁就将锁存到list中
                if(lock.tryLock(60, TimeUnit.SECONDS)) {
                    lockList.add(lock);
                } else {
                    //只要有一把锁没有得到,就直接将list中所有的锁释放并返回false,告知用户下单失败
                    lockList.forEach(l - > l.unlock());
                    return ResultData.success(false);
                }
            } catch(InterruptedException e) {
                logger.error("上锁失败,请求参数:{},失败原因:{}", JSON.toJSONString(codeList), e.getMessage(), e);
                return ResultData.success(false);
            }
        }
    }
    //到这里说明得到了所有的锁,直接执行商品扣减的逻辑了
    try {
        codeList.forEach(code - > {
            productService.deduct(code, 1);
        });
    } finally {
        //释放所有的锁
        lockList.forEach(l - > l.unlock());
    }
    //返回结果
    return ResultData.success(true);
}
```

完成编码后，我们先来试试看单线程的情况看看代码是否正常运行，将项目启动后，键入地址:

```java
http://localhost:9002/product/deductCount
```

参数

```java
[
    "P001",
    "P002"
]
```

从数据库来看，结果来看，两个商品扣减成功，业务逻辑没有问题。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301430402.png)

接下来我们就通过debug模式演示多线程导致死锁的情况，首先将代码调试模式改成线程调试模式

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301430915.png)

然后使用postman创建两个请求，一个先购买P002再P001，另一个反之

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301430634.png)

![在这里插入图片描述](https://qiniuyun.sharkchili.com/img202304071105514.png)

项目启动，我们同时发送两个请求，先让线程2获取到P002的锁，然后将执行权切到线程1。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301432165.png)

让线程1拿到P001的锁，然后让代码走完。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301433306.png)

然后我们的接口出现了长时间的阻塞，最终发现两个请求一个成功，一个失败，死锁问题出现了。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301433281.png)

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301433845.png)

我们不妨用jstack来定位一下。首先通过jps定位到web进程号。

```java
jps

16680 Launcher
20632 Jps
6792 ProductServiceApplication

19388 RemoteMavenServer
```

然后通过jstack 查看应用使用情况。

```java
jstack -l 6792
```

从控制台可以看到，正是环路等待的取锁顺序，导致我们tryLock的方法上出现了死锁的情况。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301433452.png)

解决方式也很简单，既然造成死锁的原因是双方取锁顺序相反，那么我们为什么不让两个线程按照相同的顺序取锁呢？

我们将双方购买的商品顺序，按照code排序一下，让两个线程都按照同一个方向的顺序取锁，不就可以避免死锁问题了？

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301433426.png)

代码改动的地方很少，只需添加这样一行让用户商品code排下序，这样后续的取锁逻辑就保持一致了。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301433804.png)

我们调试时就会发现，先获得锁1的线程继续尝试获取第2把锁，而另一个线程就会因为锁1被拿了状态变为wait。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301433406.png)

最终两个线程都完成库存扣减，通过排序解决环路问题解决了死锁的情况。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304301434722.png)

### 小结

锁虽然可以解决线程安全问题，但是使用时必须注意以下几点:

1. 注意保证锁的原子性。
2. 注意锁的层级，实例对象之间竞争就必须同一个对象作为锁而不是各自的实例对象。
3. 注意锁的粒度不能过大，避免将不会造成线程安全且耗时的方法放到锁中。
4. 注意环路死锁问题。

## 参考文献

[关键字: synchronized详解(opens new window)](https://www.pdai.tech/md/java/thread/java-thread-x-key-synchronized.html#synchronized原理分析)

[面渣逆袭（Java并发编程面试题八股文）必看👍 | Java程序员进阶之路 (tobebetterjavaer.com)(opens new window)](https://tobebetterjavaer.com/sidebar/sanfene/javathread.html#_25-synchronized的实现原理)

[Java 业务开发常见错误 100 例](https://time.geekbang.org/column/intro/294?utm_term=zeus134KG&utm_source=blog&utm_medium=zhuye)