# JUC包下各种锁使用详解

## Java中的锁

我们日常开发过程中为了保证临界资源的线程安全可能会用到synchronized，但是synchronized局限性也是很强的，它无法让当前线程立刻释放锁、判断线程持有锁的状态等操作。 所以为了保证用户能够在合适的场景找到合适的锁，Java设计者按照不同的维度为我们提供了各种锁。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302226165.png)

## 了解一下Lock接口

### 为什么需要Lock，它于synchronized锁的优劣

锁是一种解决资源共享问题的解决方案，相比于`synchronized`锁，`Lock`锁增加了一些更高级的功能:

1. 锁等待。
2. 锁中断。
3. 可随时释放。
4. 锁重入。

但这并不能表明，`Lock`锁是`synchronized`锁的替代品，他俩都有各自的适用场合。

### Lock接口详解

我们打开Lock类的源码可以看到这几个方法，从语义中不难看出Lock的功能还是挺灵活的，不仅可以有尝试取锁、还可以直接取锁、打断其他线程直接取锁等操作。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302226506.png)

### lock和unlock

我们以ReentrantLock来演示一下Lock类的加锁和解锁操作。细心的读者在阅读源码时可能会发现下面这样一段注释，这就是lock类上锁的解锁的基本示例了。

```java
class X {
    private final ReentrantLock lock = new ReentrantLock();
    // ...
    public void m() {
        lock.lock(); // block until condition holds
        try {
            // ... method body
        } finally {
            lock.unlock()
        }
    }
}
```

所以我们也按照上面这段示例编写一下一段demo代码。注意lock锁必须手动释放，所以为了保证释放的安全我们常常会在finally中进行释放，如官方给出的代码示例一样。

```java
public class LockDemo {

    private static ReentrantLock lock = new ReentrantLock();

    public static void main(String[] args) {
        //上锁
        lock.lock();

        try {
            System.out.println("当前线程" + Thread.currentThread().getName() + "获得锁，进行异常操作");
            int i = 1 / 0;

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("异常了");
        } finally {
            System.out.println("锁释放");
            lock.unlock();
        }

        System.out.println("当前锁是否被其他线程持有" + lock.isLocked());
    }
}
```

### tryLock

相比于普通的`lock`来说，`tryLock`相对更加强大一些，tryLock可以根据当前线程是否取得锁进行一些定制化操作。 而且tryLock可以立即返回或者在一定时间内取锁，如果拿得到就拿锁并返回true，反之返回false。

我们现在创建一个任务给两个线程使用，逻辑很简单，在每个线程在while循环中，flag为1的先取锁1，flag为2的先取锁2。 flag为1的先在规定时间内获取锁1，获得锁1后再获取锁2，如果锁2获取失败则释放锁1休眠一会。让另一个先获取锁2在获取锁1的线程执行完再进行获取锁。

```java
public class TryLockDemo implements Runnable {

    //注意使用static 否则锁的粒度用错了会导致无法锁住彼此
    private static Lock lock1 = new ReentrantLock();
    private static Lock lock2 = new ReentrantLock();

    //flag为1的先取锁1再去锁2，反之先取锁2在取锁1
    private int flag;


    public int getFlag() {
        return flag;
    }

    public void setFlag(int flag) {
        this.flag = flag;
    }

    @Override
    public void run() {
        while (true) {
            //flag为1先取锁1再取锁2
            if (flag == 1) {
                try {
                    //800ms内尝试取锁，如果失败则直接输出尝试获取锁1失败
                    if (lock1.tryLock(800, TimeUnit.MILLISECONDS)) {
                        try {
                            System.out.println(Thread.currentThread().getName()+"拿到了第一把锁lock1");
                            //睡一会，保证线程2拿锁锁2
                            Thread.sleep(new Random().nextInt(1000));
                            if (lock2.tryLock(800, TimeUnit.MILLISECONDS)) {
                                try {
                                    System.out.println(Thread.currentThread().getName()+"取到锁2");
                                    System.out.println(Thread.currentThread().getName()+"拿到两把锁，执行业务逻辑了。。。。");
                                    break;
                                } finally {
                                    lock2.unlock();

                                }
                            } else {
                                System.out.println(Thread.currentThread().getName()+"获取第二把锁锁2失败");
                            }
                        } finally {
                            //休眠一会再次获取锁
                            lock1.unlock();
                            Thread.sleep(new Random().nextInt(1000));

                        }


                    } else {
                        System.out.println(Thread.currentThread().getName()+"尝试获取锁1失败");
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

            } else {
                try {
                    //3000ms内尝试获取锁2，如果娶不到直接输出失败
                    if (lock2.tryLock(3000, TimeUnit.MILLISECONDS)) {
                        try{
                            System.out.println(Thread.currentThread().getName()+"先拿到了锁2");
                            Thread.sleep(new Random().nextInt(1000));
                            if (lock1.tryLock(800, TimeUnit.MILLISECONDS)) {
                                try {
                                    System.out.println(Thread.currentThread().getName()+"取到锁1");
                                    System.out.println(Thread.currentThread().getName()+"拿到两把锁，执行业务逻辑了。。。。");
                                    break;
                                } finally {
                                    lock1.unlock();

                                }
                            } else {
                                System.out.println(Thread.currentThread().getName()+"获取第二把锁1失败");
                            }
                        }finally {
                            //休眠一会，顺便把锁释放让其他线程获取
                            lock2.unlock();
                            Thread.sleep(new Random().nextInt(1000));

                        }

                    } else {
                        System.out.println(Thread.currentThread().getName()+"获取锁2失败");
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

测试代码

```java
public class TestTryLock {
    public static void main(String[] args) {
        //先获取锁1
        TryLockDemo t1 = new TryLockDemo();
        t1.setFlag(1);

        //先获取锁2
        TryLockDemo t2 = new TryLockDemo();
        t2.setFlag(2);

        new Thread(t1,"t1").start();
        new Thread(t2,"t2").start();
    }
}
```

输出结果如下，可以看到tryLock的存在使得我们可以不再阻塞的去获取锁，而是可以根据锁的持有情况进行下一步逻辑。

```java
t1拿到了第一把锁lock1
t2先拿到了锁2
t1获取第二把锁锁2失败
t2取到锁1
t2拿到两把锁，执行业务逻辑了。。。。
t1拿到了第一把锁lock1
t1取到锁2
t1拿到两把锁，执行业务逻辑了。。。。
```

### 可被中断的lock

为避免synchronized这种获取锁过程无法中断，进而出现死锁的情况。JUC包下的锁提供了lockInterruptibly方法，即在获取锁过程中的线程可以被打断。

```java
public class LockInterruptiblyDemo implements Runnable {


    private static ReentrantLock lock = new ReentrantLock();

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + " 尝试取锁");
        try {
            //设置为可被中断的获取锁
            lock.lockInterruptibly();
            try {
                System.out.println(Thread.currentThread().getName() + " 取锁成功");
                Thread.sleep(5000);

            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + " 执行业务逻辑时被中断");

            } finally {
                lock.unlock();
            }

        } catch (InterruptedException e) {
            System.out.println(Thread.currentThread().getName() + "尝试取锁时被中断");
        }

    }
}
```

测试代码如下，我们先让线程1获取锁成功，此时线程2取锁就会失败，我们可以手动通过interrupt将其打断。

```java
public class LockInterruptiblyTest {
    public static void main(String[] args) throws InterruptedException {
        LockInterruptiblyDemo lockInterruptiblyDemo = new LockInterruptiblyDemo();
        //线程1先获取锁，会成功
        Thread thread0 = new Thread(lockInterruptiblyDemo);
        thread0.start();

        //线程2获取锁失败，不会中断
        Thread thread1 = new Thread(lockInterruptiblyDemo);
        thread1.start();


        Thread.sleep(5000);

        //手动调用interrupt将线程中断
        thread1.interrupt();
    }
}
```

### Lock锁的可见性保证

可能很多人会对这些操作有这样的疑问，我们lock的结果如何对之后操作该资源的线程保证可见性呢？

其实根据`happens-before`原则，前一个线程操作的结果，对后一个线程是都可见的原理即可保证锁操作的可见性。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302227865.png)

## 不同分类的锁以及使用

我们在文章开头时已经对锁进行了分类，接下来我们就开始对不同的分类场景下的锁的使用和原理进行介绍。

### 按照是否锁住资源分类

#### 悲观锁

悲观锁认为自己在修改数据过程中，其他人很可能会过来修改数据，为了保证数据的准确性，他会在自己修改数据时候持有锁，在释放锁之前，其他线程是无法持有这把锁。 在Java中synchronized锁和lock锁都是典型的悲观锁。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302227988.png)

#### 乐观锁

乐观锁认为自己的修改数据时不会有其他人会修改数据，所以他每次修改数据后会判断修改前的数据是否被修改过，如果没有就修改数据。 在Java中乐观锁常常用CAS原子类来实现。

如下代码所示，原子类就是通过CAS乐观锁实现的。

```java
public static void main(String[] args) {
    AtomicInteger atomicInteger = new AtomicInteger();
    atomicInteger.incrementAndGet();
}
```

我们可以看看cas原子类getAndIncrement的源码，它会调用unsafe的getAndAddInt，将this和偏移量，还有1传入。

```java
public final int getAndIncrement() {
    return unsafe.getAndAddInt(this, valueOffset, 1);
}
```

我们在步入源码就可以知道CAS的原理了，它的步骤为:

1. 它将我们的当前线程操作时原子类变量this传入getAndAddInt方法。
2. 进入循环，原子类通过getIntVolatile方法获取到的原子类最新的值var5。
3. 通过compareAndSwapInt进行比较，我们的this对象的值和getIntVolatile得到的是否一样。
4. 如果一样，则将var5 + var4，var就是我们传入的1，即将原子类变量值+1写入到主存中。
5. 如果不一样，则进入下一次循环继续通过getIntVolatile获取值和我们的this对象比较，直到完全一样了再完成自增操作。

```java
public final int getAndAddInt(Object var1, long var2, int var4) {
    int var5;
    do {
        var5 = this.getIntVolatile(var1, var2);
    } while (!this.compareAndSwapInt(var1, var2, var5, var5 + var4));
    return var5;
}
```

我们不妨将上述的操作总结成一张流程图

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302228969.png)

#### 悲观锁和乐观锁的比较

1. 悲观锁的开销远高于乐观锁，但他确实一劳永逸的，临界区持有锁的时间就算越来越长也不会对互斥锁有任何的影响。反之乐观锁假如持有锁的时间越来越长的话，其他等待线程的自选时间也会增加，从而导致资源消耗愈发严重。
2. 悲观更适合那些经常操作修改的场景，而乐观锁更适合读多修改少的情况。

### 按照是否可重入进行锁分类

#### 可重入锁示例

代码如下所示，我们创建一个MyRecursionDemo ，这个类的逻辑很简单，让当前线程通过递归的方式连续获得锁5次。

```java
public class MyRecursionDemo {
    private ReentrantLock lock = new ReentrantLock();
    public void accessResource() {
        lock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 第" + lock.getHoldCount() + "次处理资源中");
            if(lock.getHoldCount() < 5) {
                System.out.println("当前线程是否是持有这把锁的线程" + lock.isHeldByCurrentThread());
                System.out.println("当前等待队列长度" + lock.getQueueLength());
                System.out.println("再次递归处理资源中........................................");
                //再次递归调用该方法，尝试重入这把锁
                accessResource();
            }
        } catch(Exception e) {
            e.printStackTrace();
        } finally {
            System.out.println("处理结束，释放可重入锁");
            lock.unlock();
        }
    }
}
```

测试代码

```java
public class MyRecursionDemoTest {
    public static void main(String[] args) {
        MyRecursionDemo myRecursionDemo=new MyRecursionDemo();
        myRecursionDemo.accessResource();
    }
}
```

从输出结果来看main线程第一次成功取锁之后，在不释放的情况下，连续尝试取ReentrantLock 5次都是成功的，是支持可重入的。

```java
main 第1次处理资源中
当前线程是否是持有这把锁的线程true
当前等待队列长度0
再次递归处理资源中........................................
main 第2次处理资源中
当前线程是否是持有这把锁的线程true
当前等待队列长度0
再次递归处理资源中........................................
main 第3次处理资源中
当前线程是否是持有这把锁的线程true
当前等待队列长度0
再次递归处理资源中........................................
main 第4次处理资源中
当前线程是否是持有这把锁的线程true
当前等待队列长度0
再次递归处理资源中........................................
main 第5次处理资源中
处理结束，释放可重入锁
处理结束，释放可重入锁
处理结束，释放可重入锁
处理结束，释放可重入锁
处理结束，释放可重入锁
```

#### 不可重入锁

NonReentrantLock就是典型的不可重入锁，代码示例如下:

```java
public class NonReentrantLockDemo {
    public static void main(String[] args) {
        NonReentrantLock lock=new NonReentrantLock();
        lock.lock();
        System.out.println(Thread.currentThread().getName()+"第一次获取锁成功");
        lock.lock();
        System.out.println(Thread.currentThread().getName()+"第二次获取锁成功");
    }
}
```

从输出结果来看，第一次获取锁之后就无法再次重入锁了。

```java
main第一次获取锁成功
```

#### 源码解析可重入锁和非可重入锁区别

如下所示，我们通过debug发现，可重入锁进行锁定逻辑时，会判断持有锁的线程是否是当前线程，如果是则将count自增。

```java
 final boolean nonfairTryAcquire(int acquires) {
          .....
            //如果当前线程仍然持有这把锁，记录一下持有锁的次数 并返回拿锁成功
            else if (current == getExclusiveOwnerThread()) {
            //增加上锁次数
                int nextc = c + acquires;
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                    //更新当前锁上锁次数
                setState(nextc);
                return true;
            }
            return false;
        }
```

相比之下不可重入锁的逻辑就比较简单了，如下源码NonReentrantLock所示，通过CAS修改取锁状态，若成功则将锁持有者设置为当前线程。 同一个线程再去取锁时并没有重入的处理，仍然是进行CAS操作，很明显这种情况是会失败的。

```java
protected final boolean tryAcquire(int acquires) {
    // 通过CAS修改锁状态
    if(compareAndSetState(0, 1)) {
        //若成功则将锁持有者设置为当前线程
        owner = Thread.currentThread();
        return true;
    }
    return false;
}
```

### 公平锁和非公平锁

公平锁可以保证线程持锁顺序会有序进行，而非公平锁则可以在某些特定情况下让线程可以插队。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302228903.png)

非公平锁的设计初衷也很明显，非公平锁的设计就是为了在线程唤醒期间的空档期让其他线程可以插队，从而提高程序运行效率的最佳解决方案。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302228517.png)

#### 公平锁代码示例

我们先创建一个任务类的代码，run方法逻辑很简单，上一次锁打印输出一个文件，这里会上锁两次打印两次。构造方法中要求传一个布尔值，这个布尔值如果为true则说明ReentrantLock 为公平，反之为非公平。

```java
public class MyPrintQueue implements Runnable {


    private boolean fair;

    public MyPrintQueue(boolean fair) {
        this.fair = fair;
    }

    /**
     * true为公平锁 false为非公平锁
     */
    private ReentrantLock lock = new ReentrantLock(fair);

    /**
     * 上锁两次打印输出两个文件
     */
    public void printStr() {
        lock.lock();
        try {
            int s = new Random().nextInt(10) + 1;
            System.out.println("正在打印第一份文件。。。。当前打印线程:" + Thread.currentThread().getName() + " 需要" + s + "秒");
            Thread.sleep(s * 1000);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }

        lock.lock();
        try {
            int s = new Random().nextInt(10) + 1;
            System.out.println("正在打印第二份文件。。。。当前打印线程:" + Thread.currentThread().getName() + " 需要" + s + "秒");
            Thread.sleep(s * 1000);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void run() {
        printStr();
    }
}
```

测试代码

```java
public class FairLockTest {
    public static void main(String[] args) {

        //创建10个线程分别执行这个任务
        MyPrintQueue task=new MyPrintQueue(true);
        Thread[] threads = new Thread[10];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(task);
        }

        for (int i = 0; i < threads.length; i++) {
            threads[i].start();
            try{
                Thread.sleep(100);
            }catch (Exception e){

            }
        }

    }
}
```

从输出结果来看，线程是按顺序执行的

```java
正在打印第一份文件。。。。当前打印线程:Thread-0 需要2秒
正在打印第二份文件。。。。当前打印线程:Thread-0 需要8秒
正在打印第一份文件。。。。当前打印线程:Thread-1 需要1秒
正在打印第二份文件。。。。当前打印线程:Thread-1 需要8秒
正在打印第一份文件。。。。当前打印线程:Thread-2 需要2秒
正在打印第二份文件。。。。当前打印线程:Thread-2 需要9秒
正在打印第一份文件。。。。当前打印线程:Thread-3 需要10秒
正在打印第二份文件。。。。当前打印线程:Thread-3 需要2秒
正在打印第一份文件。。。。当前打印线程:Thread-4 需要10秒
正在打印第二份文件。。。。当前打印线程:Thread-4 需要1秒
正在打印第一份文件。。。。当前打印线程:Thread-5 需要5秒
正在打印第二份文件。。。。当前打印线程:Thread-5 需要8秒
正在打印第一份文件。。。。当前打印线程:Thread-6 需要9秒
正在打印第二份文件。。。。当前打印线程:Thread-6 需要6秒
正在打印第一份文件。。。。当前打印线程:Thread-7 需要9秒
正在打印第二份文件。。。。当前打印线程:Thread-7 需要8秒
正在打印第一份文件。。。。当前打印线程:Thread-8 需要6秒
正在打印第二份文件。。。。当前打印线程:Thread-8 需要6秒
正在打印第一份文件。。。。当前打印线程:Thread-9 需要6秒
正在打印第二份文件。。。。当前打印线程:Thread-9 需要4秒
```

非公平锁将标志调整为false即可，这里就不多做演示了。

#### 通过源码查看两者实现逻辑

如下所示，我们可以在构造方法中看到公平锁和非公平锁是如何根据参数决定的。

```java
public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
}
```

我们不妨看看ReentrantLock公平锁的内部类FairSync的源码，如下所示，可以看到，他的取锁逻辑必须保证当前取锁的节点没有前驱节点才能抢锁，这也就是为什么我们的线程会排队取锁。

```java
static final class FairSync extends Sync {
    protected final boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if(c == 0) {
            //当前节点没有前驱节点的情况下才能进行取锁
            if(!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        } else if(current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;
            if(nextc < 0) throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }
}
```

相比之下，非公平锁就很粗暴了，我们看看ReentrantLock内部类NonfairSync，只要CAS成功就行了，所以锁一旦空闲，所有线程都可以随机争抢。

```java
final void lock() {
    if(compareAndSetState(0, 1)) setExclusiveOwnerThread(Thread.currentThread());
    else acquire(1);
}
```

#### 公平锁和非公平锁总结

相对之下公平锁由于是有序执行，所以相对非公平锁来说执行更慢，吞吐量更小一些。 而非公平锁可以在特定场景下实现插队，所以很有可能出现某些线程被频繁插队而导致`"线程饥饿"`的情况。

### 共享锁和非共享锁

共享锁最常见的使用就是ReentrantReadWriteLock，他的读锁就是共享锁，当某一线程使用读锁时，其他线程也可以使用读锁，因为读不会修改数据，无论多少个线程读都可以。

而写锁就是独占锁的典型，当某个线程执行写时，为了保证数据的准确性，其他线程无论使用读锁还是写锁，都得阻塞等待当前正在使用写锁的线程释放锁才能执行。

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302229956.png)

#### 读写锁使用示例

代码的逻辑也很简单，获取读锁读取数据，获取写锁修改数据。

```java
public class BaseRWdemo {

    private static ReentrantReadWriteLock reentrantReadWriteLock = new ReentrantReadWriteLock();
    //读锁
    private static ReentrantReadWriteLock.ReadLock readLock = reentrantReadWriteLock.readLock();
    //写锁
    private static ReentrantReadWriteLock.WriteLock writeLock = reentrantReadWriteLock.writeLock();

    private static void read() {
        //获取读锁，读取数据
        readLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + "得到读锁");
            Thread.sleep(1000);
        } catch (Exception e) {
            e.printStackTrace();
        }finally {
            System.out.println(Thread.currentThread().getName() + "释放了读锁");
            readLock.unlock();
        }

    }


    private static void write() {
        //获取写锁，写数据
        writeLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + "得到写锁");
            Thread.sleep(1000);
        } catch (Exception e) {

        }finally {
            System.out.println(Thread.currentThread().getName() + "释放了写锁");
            writeLock.unlock();
        }

    }


    
}
```

测试代码

```java
public static void main(String[] args) {
        //读锁可以一起获取
        new Thread(() -> read(), "thread1").start();
        new Thread(() -> read(), "thread2").start();

        
        //等上面读完写锁才能用 从而保证线程安全问题
        new Thread(() -> write(), "thread3").start();
        //等上面写完 才能开始写 避免线程安全问题
        new Thread(() -> write(), "thread4").start();
    }
```

从输出结果不难看出，一旦资源被上了读锁，写锁就无法操作，只有读锁操作结束，写锁才能操作资源。

```java
thread1得到读锁
thread2得到读锁
thread1释放了读锁
thread2释放了读锁


# 写锁必须等读锁释放了才能操作

thread3得到写锁
thread3释放了写锁
thread4得到写锁
thread4释放了写锁
```

#### 读写锁插队示例

我们都知道读锁是共享锁，而写锁是独占锁，所以当队列中前驱节点是读锁时且我们设置的读写锁是非公平锁的情况下，我们就可以让写锁插队写一些重要的数据，再让其他读锁继续工作。

先看看我们的demo类，将读写锁设置为非公平锁。

```java
public class NoFairReadSDemo {
    //设置为false之后 非公平 等待队列前是读锁 就可以让读锁插队
    private static ReentrantReadWriteLock reentrantReadWriteLock = new ReentrantReadWriteLock(false);
    private static ReentrantReadWriteLock.ReadLock readLock = reentrantReadWriteLock.readLock();
    private static ReentrantReadWriteLock.WriteLock writeLock = reentrantReadWriteLock.writeLock();

    private static void read() {
        System.out.println(Thread.currentThread().getName() + "尝试获取读锁");
        readLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + "得到了读锁");
            Thread.sleep(20);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            System.out.println(Thread.currentThread().getName() + "释放了读锁");
            readLock.unlock();
        }

    }


    private static void write() {
        System.out.println(Thread.currentThread().getName() + "尝试获取读锁");
        writeLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + "得到了写锁");
            Thread.sleep(40);
        } catch (Exception e) {

        } finally {
            System.out.println(Thread.currentThread().getName() + "释放了写锁");
            writeLock.unlock();
        }

    }


   
}
```

测试代码如下，从输出结果可以看出，在非公平锁的情况下，写锁可以插队。

```java
public static void main(String[] args) {
    //写锁在前 非公平锁 避免饥饿 读锁不让上前
    new Thread(() - > write(), "Thread1").start();
    //        两个读锁并行
    new Thread(() - > read(), "Thread2").start();
    new Thread(() - > read(), "Thread3").start();
    //写锁在前 非公平锁 避免饥饿 读锁不让上前
    new Thread(() - > write(), "Thread4").start();
    new Thread(() - > read(), "Thread5").start();
    //        尝试让写锁插队 读锁在前的情况，可以看到写锁上锁成功了
    new Thread(() - > {
        Thread[] threads = new Thread[1000];
        for(int i = 0; i < 1000; i++) {
            threads[i] = new Thread(() - > read(), "子线程创建的Thread" + i);
        }
        for(int i = 0; i < 1000; i++) {
            threads[i].start();
        }
    }).start();
}
```

输出结果

![在这里插入图片描述](https://cdn.jsdelivr.net/gh/xfycoding/blogImage/img/202304302229787.png)

#### 源码解析写锁插队原理

通过debug我们可以看到一个tryAcquireShared方法，这里面有个核心判断readerShouldBlock方法，他会判断获取当前读锁时是否应该阻塞，我们不妨步进看看。

```java
protected final int tryAcquireShared(int unused) {
    Thread current = Thread.currentThread();
    int c = getState();
    if(exclusiveCount(c) != 0 && getExclusiveOwnerThread() != current) return -1;
    int r = sharedCount(c);
    //核心逻辑，判断读锁是否应该阻塞
    if(!readerShouldBlock() && r < MAX_COUNT && compareAndSetState(c, c + SHARED_UNIT)) {.......
        return 1;
    }
    return fullTryAcquireShared(current);
}
```

可以看到逻辑也很简单，如果现在等待队列中的节点是独占锁(这里就是我们的读锁)，返回成功，进而让读锁操作数据。这就应证了我们上述的观点，等待队列首节点是写锁占有锁的情况下，写锁是可以进行插队的。

```java
final boolean readerShouldBlock() {
    //判断这个锁是否是独占锁    
    return apparentlyFirstQueuedIsExclusive();
}
```

#### 读写锁的升降级

锁的升降级常用于如下这样一段场景

> 例如：我们现在有一段功能需要在日志中写入一段内容，然后在进行日志读取统计操作，这时候我们就需要先使用写锁，然后再使用读锁。

如果我们这种操作在正常场景下，我们需要频繁的释放写锁然后再使用读锁，那么程序执行的性能就会大打折扣。 所以，Java对此进行了优化，但我们使用写锁的时，可以让他降级变为读锁，这样就可高效完成某个先写后读的操作。 这时候肯定有人问了，那是否可以先读后写呢？答案是不行的，我们都知道使用写锁的前提是释放读锁，因为是写锁的独占锁，他要求当前这把锁只能它拥有。 假如我们有两个线程a和线程b，双方都持有当前对象的读锁。这时候他们都需要当前这把写锁，于是双方都在等待对方释放读锁，于是就这样僵持着造成了死锁。所以JUC包设计就使得读写锁只支持降级，不支持升级(即只支持先写后读)。 所以，读写锁的非公平锁更适合于那些读多写少的情况。

### 自旋锁和非自旋锁

我们都知道Java阻塞或者唤醒一个线程都需要切换CPU状态的，这样的操作非常耗费时间，而很多线程切换后执行的逻辑仅仅是一小段代码，为了这一小段代码而耗费这么长的时间确实是一件得不偿失的事情。对此java设计者就设计了一种让线程不阻塞，原地"稍等"即自旋一下的操作。

#### 自旋锁代码示例

如下代码所示，我们通过AtomicReference原子类实现了一个简单的自旋锁，通过compareAndSet尝试让当前线程持有资源，如果成功则执行业务逻辑，反之循环等待。

```java
public class MySpinLock {
    private AtomicReference<Thread> sign = new AtomicReference<>();

    public void lock() {
        Thread curThread = Thread.currentThread();
        //使用原子类自旋设置原子类线程，若线程设置为当前线程则说明当前线程上锁成功
        while (!sign.compareAndSet(null, curThread)) {
            System.out.println(curThread.getName() + "未得到锁，自旋中");
        }
    }

    public void unLock() {
        Thread curThread = Thread.currentThread();
        sign.compareAndSet(curThread, null);
        System.out.println(curThread.getName() + "释放锁");

    }

    public static void main(String[] args) {
        MySpinLock mySpinLock = new MySpinLock();
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                System.out.println(Thread.currentThread().getName() + "尝试获取自旋锁");
                mySpinLock.lock();
                System.out.println(Thread.currentThread().getName() + "得到了自旋锁");
                try {
                    Thread.sleep(300);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    mySpinLock.unLock();
                    System.out.println(Thread.currentThread().getName() + "释放了自旋锁");
                }

            }
        };

        Thread t1=new Thread(runnable,"t1");
        Thread t2=new Thread(runnable,"t2");
        t1.start();
        t2.start();
    }
}
```

输出结果

```java
t1尝试获取自旋锁
t2尝试获取自旋锁
t1得到了自旋锁
t2未得到锁，自旋中
t2未得到锁，自旋中
t2未得到锁，自旋中
t2未得到锁，自旋中
t2未得到锁，自旋中
t2未得到锁，自旋中
t1释放锁
t2得到了自旋锁
t1释放了自旋锁
t2释放锁
t2释放了自旋锁
```

### 可中断锁和非可中断锁

可中断锁上文lockInterruptibly上文已经演示过了，这里就不多做赘述了。

```java
public class LockInterruptiblyDemo implements Runnable {


//设置为static，所有对象共享
    private static ReentrantLock lock = new ReentrantLock();

    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + " 尝试取锁");
        try {
        //设置锁可以被打断
            lock.lockInterruptibly();
            try {
                System.out.println(Thread.currentThread().getName() + " 取锁成功");
                Thread.sleep(5000);

            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + " 执行业务逻辑时被中断");

            } finally {
                lock.unlock();
            }

        } catch (InterruptedException e) {
            System.out.println(Thread.currentThread().getName() + "尝试取锁时被中断");
        }

    }
}
```

测试代码

```java
public static void main(String[] args) throws InterruptedException {
    LockInterruptiblyDemo lockInterruptiblyDemo = new LockInterruptiblyDemo();
    //线程1启动
    Thread thread0 = new Thread(lockInterruptiblyDemo);
    thread0.start();
    //线程2启动
    Thread thread1 = new Thread(lockInterruptiblyDemo);
    thread1.start();
    //主线程休眠，让上述代码执行，然后执行打断线程1逻辑 thread0.interrupt();
    Thread.sleep(2000);
    thread0.interrupt();
}
```

这里补充一下可中断锁的原理，可中断锁实现的可中断的方法很简单，通过acquireInterruptibly建立一个可中断的取锁逻辑。

```java
public void lockInterruptibly() throws InterruptedException {
    sync.acquireInterruptibly(1);
}
```

我们不如源码可以看到，对于没有获得锁的线程，判断走到interrupted看看当前线程是否被打断，如果打断了则直接抛出中断异常。

```java
public final void acquireInterruptibly(int arg)
throws InterruptedException {
    //当线程被打断时，直接抛出中断异常
    if(Thread.interrupted()) throw new InterruptedException();
    if(!tryAcquire(arg)) doAcquireInterruptibly(arg);
}
```

## 使用锁的注意事项

1. 缩小同步代码块
2. 尽量不要锁住方法，减少锁的粒度
3. 减少请求锁的次数
4. 锁中尽量不要包含锁
5. 选择合适的锁类型

## 参考文献

[Lock锁------lockInterruptibly()方法](https://blog.csdn.net/qq_43323776/article/details/82939344)