pipeline {
    agent {
        kubernetes {
            cloud 'kubernetes'
            inheritFrom 'default'
            yaml '''
        apiVersion: v1
        kind: Pod
        metadata:
          labels:
            some-label: some-label-value
        spec:
          containers:
          - name: java
            image: openjdk:11
            command:
            - cat
            tty: true   
          - name: node
            image: node:20.1.0-alpine3.17
            command:
            - cat
            tty: true          
        '''
        }
    }

    environment {
        PROD = "${env.GIT_BRANCH == 'main' || env.GIT_BRANCH == 'master'}"
        APPLICATION_VERSION="1.0.${BUILD_NUMBER}"
    }

    stages {
        stage('build') {
            steps {
                container('node') {
                    sh "npm install"
                    sh "npm run compile"
                    sh "npm run bundle"
                }
                container('java') {
                    sh "./gradlew clean build --no-daemon"
                }
            }
        }
//        stage('release') {
//            steps {
////                if(env.PROD == "true") {
//                container('java') {
//                    withCredentials([usernamePassword(credentialsId: 'docker-hub', passwordVariable: 'REGISTRY_PASSWORD', usernameVariable: 'REGISTRY_USERNAME')]) {
//                        sh "./gradlew clean jib --no-daemon -Papplication.version=${APPLICATION_VERSION}"
//                    }
////                }
//                }
//            }
//        }
//        stage('deploy') {
//            steps {
//                sh "sed 's/DOCKER_IMAGE/nstream\\/demo-ripple:${APPLICATION_VERSION}/g' k8s.yml > k8s.apply.yml"
//                archiveArtifacts artifacts: 'k8s.apply.yml', followSymlinks: false
//
//                withCredentials([string(credentialsId: 'demo-deployer-k8s-cluster-ca', variable: 'CLUSTER_CA'), string(credentialsId: 'demo-deployer-k8s-cluster-endpoint', variable: 'ENDPOINT')]) {
//                    withKubeConfig(caCertificate: CLUSTER_CA, credentialsId: 'demo-deployer-k8s-cluster-token', serverUrl: ENDPOINT) {
//                        container('java'){
//                            // TODO Figure out a container we can use that already has kubectl so we don't download it each time
//                            sh "curl --no-progress-meter -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.25.7/2023-03-17/bin/linux/amd64/kubectl"
//                            sh "chmod +x ./kubectl"
//                            sh "./kubectl apply -f k8s.apply.yml"
//                        }
//                    }
//                }
//            }
//        }
    }
}